function updateStatus(isLoading) {
    const statusContainer = document.getElementById('statusContainer');
    const spinner = document.querySelector('.spinner');
    const checkmark = document.querySelector('.checkmark');
    const statusText = document.querySelector('.status-text');
    
    if (isLoading) {
        statusContainer.style.display = 'block';
        spinner.style.display = 'block';
        checkmark.style.display = 'none';
        statusText.textContent = 'Processing...';
    } else {
        spinner.style.display = 'none';
        checkmark.style.display = 'flex';
        statusText.textContent = 'Downloaded Successfully, files will be in your download folder in several seconds';
        setTimeout(() => { 
            statusContainer.style.display = 'none';
        }, 15000);
    }
}

function downloadMergedFile(url){
    // Parse the URL object once
    const urlObj = JSON.parse(url);
    updateStatus(true);
    
    // Create a hidden iframe to handle the download
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Submit a form to trigger the download
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/download/merged';
    form.target = iframe.name;
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'files';
    // Send the files array directly since urlObj is already parsed
    input.value = JSON.stringify(urlObj.files);
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
        updateStatus(false);
    }, 2000);
}

function downloadSeparatedFile(url){
    // Parse the URL object once
    const urlObj = JSON.parse(url);
    updateStatus(true);
    
    // Create a hidden iframe to handle the download
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Submit a form to trigger the download
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/download/separated';
    form.target = iframe.name;
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'files';
    // Send the files array directly since urlObj is already parsed
    input.value = JSON.stringify(urlObj.files);
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
        updateStatus(false);
    }, 2000);
}
