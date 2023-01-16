document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('json-form');
  const input = document.getElementById('json-input');
  const output = document.getElementById('csv-output');
  const copyButton = document.getElementById('copy-button');
  const downloadButton = document.getElementById('download-button');

  const root = document.querySelector(':root');

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }

  form.addEventListener('submit', function(event) {
    event.preventDefault();

    // Try to parse the input as JSON
    let data;
    try {
      data = JSON.parse(input.value);
      const beautifiedJson = jsonlint.parse(input.value);
      input.value = JSON.stringify(beautifiedJson, null, 3);
    } catch (error) {
      // Input is not JSON, display an error message
      alert('Invalid JSON input');
      return;
    }

    function getKeys(object, columns) {
      for (const key in object) {
        if (!columns.includes(key)) {
          columns.push(key);
        }
      }
    }

    // Transform the data into a flat array of columns
    let columns = [];
    let rows;
    if (Array.isArray(data) && !Array.isArray(data[0]) && typeof data[0] !== 'object') {
      // Handle case where input is a list of values
      columns = ['values'];
      rows = data.map(value => [value]);
    } else if (Array.isArray(data) && typeof data[0] === 'object') {
      // Handle case where input is an array of objects
      for (const object of data) {
        getKeys(object, columns);
      }
      rows = data.map(object => columns.map(column => object[column]));
    } else if (Object.values(data).every(value => Array.isArray(value))) {
      // Handle case where input is a dictionary of lists
      columns = Object.keys(data);
      rows = data[columns[0]].map((_, i) =>
        columns.reduce((row, column) => ({ ...row, [column]: data[column][i] }), {})
      );
    } else if (Object.values(data).every(value => typeof value === 'object')) {
      // Handle case where input is a dictionary of dictionaries
      columns = Object.keys(data);
      rows = columns.map(column => Object.values(data[column]));
    } else {
      // Handle case where input is a single object
      columns = Object.keys(data);
      rows = Object.values(data);
    }

    // Convert the data to CSV format
    const csv = Papa.unparse({ fields: columns, data: rows });

    // Display the CSV data and enable the buttons
    output.value = csv;
    document.getElementById('result').style.display = 'block';
    copyButton.disabled = false;
    downloadButton.disabled = false;
  });

  copyButton.addEventListener('click', function() {
    // Copy the CSV data to the clipboard
    navigator.clipboard.writeText(output.value);
  });

  downloadButton.addEventListener('click', function() {
    // Create a download link and click it
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(output.value));
    link.setAttribute('download', 'data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});

