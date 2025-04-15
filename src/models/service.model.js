import * as cheerio from "cheerio";
import axios from "axios";
import url from "url";


class ServiceModel {
    constructor (){
        this.fileExtensions = [".pdf", ".ppt", ".pptx", ".doc", ".hwp", ".hwpx", ".xls", ".xlsx", ".zip"];
    }

    async getFiles(links){
        try {
            if (!links) {
                throw new Error("No links provided");
            }

            const results = [];
            
            if(Array.isArray(links)){
                // Use Promise.all to wait for all async operations
                const promises = links.map(link => this.checkForFileTypes(link));
                const linkResults = await Promise.all(promises);
                results.push(...linkResults);
            } else {
                const result = await this.checkForFileTypes(links);
                results.push(result);
            }
            
            return results;
        } catch (error) {
            console.error("Error in getFiles:", error);
            throw error;
        }
    }

    async checkForFileTypes(targetUrl) {
        try {
            if (!targetUrl || typeof targetUrl !== 'string') {
                throw new Error("Invalid URL provided");
            }

            // Validate URL format
            try {
                new URL(targetUrl);
            } catch (e) {
                throw new Error("Invalid URL format");
            }

            // Get HTML content with timeout
            const response = await axios.get(targetUrl, {
                timeout: 10000, // 10 second timeout
                validateStatus: function (status) {
                    return status >= 200 && status < 300; // Only accept 2xx status codes
                }
            });
            
            const html = response.data;
            
            // Parse HTML
            const $ = cheerio.load(html);
            
            // Extract all links
            const links = [];
            $('a').each((index, element) => {
                const href = $(element).attr('href');
                if (href) {
                    try {
                        // Convert relative URLs to absolute
                        const absoluteUrl = url.resolve(targetUrl, href);
                        links.push(absoluteUrl);
                    } catch (e) {
                        console.warn(`Failed to resolve URL: ${href}`);
                    }
                }
            });
            
            // Filter links by file extension
            const matchingFiles = links.filter(link => {
                return this.fileExtensions.some(ext => 
                    link.toLowerCase().endsWith(ext.toLowerCase())
                );
            });
            
            return {
                url: targetUrl,
                found: matchingFiles.length > 0,
                files: matchingFiles
            };
            
        } catch (error) {
            console.error('Error checking URL for files:', error.message);
            return {
                url: targetUrl,
                found: false,
                files: [],
                error: error.message
            };
        }
    }
      

    
}

export default ServiceModel;
