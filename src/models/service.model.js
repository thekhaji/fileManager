import * as cheerio from "cheerio";
import axios from "axios";
import url from "url";


class ServiceModel {
    constructor (){
        this.fileExtensions = [".pdf", ".ppt", ".pptx", ".doc", ".hwp", ".hwpx", ".xls", ".xlsx", ".zip"];
    }

    async getFiles(links){
        try {
            const result = [];
            if(Array.isArray(links)){
                result.push(links.forEach(async(link)=>{
                    await this.checkForFileTypes(link);
                }));
            }
            else{
                result.push(await this.checkForFileTypes(links));
            }
            
            console.log("result:", result);
            return true;
        } catch (error) {
            console.log("Error, getFiles:", error);
            throw new Error(error) ;
        }
    }

    async checkForFileTypes(targetUrl) {
        try {
          // Get HTML content
          const response = await axios.get(targetUrl);
          const html = response.data;
          
          // Parse HTML
          const $ = cheerio.load(html);
          
          // Extract all links
          const links = [];
          $('a').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
              // Convert relative URLs to absolute
              const absoluteUrl = url.resolve(targetUrl, href);
              links.push(absoluteUrl);
            }
          });
          
          // Filter links by file extension
          const matchingFiles = links.filter(link => {
            return this.fileExtensions.some(ext => 
              link.toLowerCase().endsWith(ext.toLowerCase())
            );
          });
          
          return {
            found: matchingFiles.length > 0,
            files: matchingFiles
          };
          
        } catch (error) {
          console.error('Error checking URL for files:', error.message);
          throw error;
        }
      }
      

    
}

export default ServiceModel;
