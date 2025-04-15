import * as cheerio from "cheerio";
import axios from "axios";
import url from "url";
import libre from "libreoffice-convert";
import archiver from "archiver";
import fs from "fs";
import tmp from "tmp";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";

class ServiceModel {
    constructor() {
        this.fileExtensions = [".pdf", ".ppt", ".pptx", ".doc", ".hwp", ".hwpx", ".xls", ".xlsx", ".zip"];
    }

    async getFiles(links) {
        if (!links) throw new Error("No links provided");

        const results = [];

        const urls = Array.isArray(links) ? links : [links];
        const linkResults = await Promise.all(urls.map(link => this.checkForFileTypes(link)));
        results.push(...linkResults);

        return results;
    }

    async checkForFileTypes(targetUrl) {
        if (!targetUrl || typeof targetUrl !== "string") throw new Error("Invalid URL provided");

        try {
            new URL(targetUrl);
        } catch {
            throw new Error("Invalid URL format");
        }

        const staticResult = await this.fetchStaticContent(targetUrl);

        if (!staticResult.found) {
            console.log("No files found in static HTML. Trying Puppeteer for dynamic content.");
            return await this.fetchDynamicContent(targetUrl);
        }

        return staticResult;
    }

    async fetchStaticContent(targetUrl) {
        try {
            const response = await axios.get(targetUrl, {
                timeout: 10000,
                maxRedirects: 5,
                validateStatus: status => status >= 200 && status < 300
            });

            const $ = cheerio.load(response.data);
            const links = [];

            $('a[href], a[src], a[data-href]').each((_, el) => {
                const href = $(el).attr('href') || $(el).attr('src') || $(el).attr('data-href');
                if (href && this.fileExtensions.some(ext => href.toLowerCase().endsWith(ext))) {
                    links.push(url.resolve(targetUrl, href));
                }
            });

            console.log("Static content files found:", links);
            return { url: targetUrl, found: links.length > 0, files: links };
        } catch (error) {
            console.error("Error fetching static content:", error.message);
            return { url: targetUrl, found: false, files: [], error: error.message };
        }
    }

    async fetchDynamicContent(targetUrl) {
        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.goto(targetUrl, { waitUntil: 'networkidle2' });

            // Wait for elements likely to contain download links
            await page.waitForSelector('a[href], a[src], a[data-href]', { timeout: 10000 });

            const html = await page.content();
            await browser.close();

            const $ = cheerio.load(html);
            const links = [];

            $('a[href], a[src], a[data-href]').each((_, el) => {
                const href = $(el).attr('href') || $(el).attr('src') || $(el).attr('data-href');
                if (href && this.fileExtensions.some(ext => href.toLowerCase().endsWith(ext))) {
                    links.push(url.resolve(targetUrl, href));
                }
            });

            console.log("Dynamic content files found:", links);
            return { url: targetUrl, found: links.length > 0, files: links };
        } catch (error) {
            console.error("Error fetching dynamic content with Puppeteer:", error.message);
            return { url: targetUrl, found: false, files: [], error: error.message };
        }
    }

    async downloadFile(fileUrls) {
        if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
            throw new Error("file URLs are required.");
        }

        const downloadPromises = fileUrls.map(async url => {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            const originalName = url.split('/').pop();
            return { buffer, name: originalName };
        });

        return await Promise.all(downloadPromises);
    }

    async seperateDownload(urlObj, res) {
        try {
            console.log("Starting separate download for URL:", urlObj.files);

            if (!urlObj.files || !Array.isArray(urlObj.files)) {
                throw new Error("Invalid URL object: files array is required");
            }

            const files = await this.downloadFile(urlObj.files);
            let pdfFiles = files.map(file => new Promise((resolve, reject) => {
                libre.convert(file.buffer, '.pdf', undefined, (err, done) => {
                    if (err) reject(err);
                    else {
                        const pdfName = file.name.replace(/\.[^/.]+$/, '.pdf');
                        resolve({ name: pdfName, buffer: done });
                    }
                });
            }));

            pdfFiles = await Promise.all(pdfFiles);

            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('error', err => {
                console.error("Archiver error:", err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error creating zip file' });
                }
            });

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename=download.zip');

            archive.pipe(res);

            for (const file of pdfFiles) {
                if (file?.name && file?.buffer) {
                    archive.append(file.buffer, { name: file.name });
                }
            }

            await archive.finalize();
            console.log("Download zip finalized.");
        } catch (error) {
            console.error("Error in separateDownload:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async mergedDownload(urlObj, res) {
        try {
            console.log("Starting merged download for URL:", urlObj.files);

            if (!urlObj.files || !Array.isArray(urlObj.files)) {
                throw new Error("Invalid URL object: files array is required");
            }

            const files = await this.downloadFile(urlObj.files);
            const convertPromises = files.map(file => new Promise((resolve, reject) => {
                libre.convert(file.buffer, '.pdf', undefined, (err, done) => {
                    if (err) reject(err);
                    else resolve(done);
                });
            }));

            const pdfBuffers = await Promise.all(convertPromises);

            const mergedPdf = await PDFDocument.create();

            for (let i = 0; i < pdfBuffers.length; i++) {
                const pdf = await PDFDocument.load(pdfBuffers[i]);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));

                // 👉 Add blank separator page *after* each file, except the last one
                if (i < pdfBuffers.length - 1) {
                    const blankPage = mergedPdf.addPage();
                    const { width, height } = blankPage.getSize();
                    blankPage.drawText('--- End of Document ---', {
                        x: width / 2 - 100,
                        y: height / 2,
                        size: 18,
                    });
                }
            }

            const finalPdf = await mergedPdf.save();

            console.log("merged pdf created:", finalPdf);
            
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename=download.zip');

            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.pipe(res);
            archive.append(Buffer.from(finalPdf), { name: 'merged.pdf' });
            await archive.finalize();
            console.log("Download mergedPDF file zip finalized.");

        } catch (error) {
            console.error("Error in separateDownload:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: error.message });
            }
        }
    }
}

export default ServiceModel;
