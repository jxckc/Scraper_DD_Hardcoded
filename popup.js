document.getElementById('scrapeButton').addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  
  if (!currentTab?.url?.includes('doordash.com')) {
    document.getElementById('status').textContent = 'Please navigate to DoorDash first';
    return;
  }

  document.getElementById('status').textContent = 'Analyzing page...';
  
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'startScrape'
    });
    
    if (response.success) {
      document.getElementById('status').textContent = 'Analysis complete! Check the console for results.';
    } else {
      document.getElementById('status').textContent = 'Error: ' + (response.error || 'Unknown error');
    }
  } catch (error) {
    document.getElementById('status').textContent = 'Error: ' + error.message;
  }
}); 