const fs = require('fs')
const cheerio = require('cheerio');
const config = require('./config.json')
const htmlString = fs.readFileSync(config.htmlFile)

/**
 * 
 * DEFINITION
 */
class Template {
    #htmlString
    #$

    constructor(htmlString) {
        this.#htmlString = htmlString
        this.#$ = cheerio.load(htmlString)
    }

    getHtmlString() {
        return this.#$.html()
    }

    processTable() {
        const loopRow = this.#$('tr:contains("[TABLE")');
        console.log(loopRow.length, 'loopRowloopRow')
        if (loopRow.length === 0) {
            console.log('[loop] row not found.');
            return this
        }

        // Insert {{#each items}} after the removed loop row
        loopRow.after('{{#each items}}');
        loopRow.remove();

        // Get the last child of <table>
        const lastChild = this.#$('tbody').children().last();

        // Append {{/each}} before the last child
        lastChild.after('{{/each}}');
        return this
    }


    processImages() {
        this.#$('img[src]').each((index, imgElement) => {
            const originalSrc = this.#$(imgElement).attr('src');
            const newSrc = `{{asset '${originalSrc}' 'dataURI'}}`;

            // Replace the "src" attribute with the new value
            this.#$(imgElement).attr('src', newSrc);
        });

        return this
    }
    processCharts() {

        const result = [];
        const $ = this.#$
        $('td:contains("LINE CHART")').each(function () {
            const td = $(this);

            // Find the first occurrence of {{...}}
            const datasourceMatch = td.text().match(/\{\{(.*?)\}\}/);

            if (datasourceMatch && datasourceMatch[0].trim() !== "") {
                const datasource = datasourceMatch[0];

                // Generate a unique ID for the <canvas> element
                const canvasId = `canvas_${Math.random().toString(36).substring(2, 15)}`;

                // Replace the content inside <td> with a <canvas> element
                td.html(`<canvas id="${canvasId}"></canvas>`);

                // Add information to the result array
                result.push({
                    id: canvasId,
                    datasource,
                });
            }
        });

        // Append a <script> section to define the 'result' variable
        const script = `
        <script>
          const result = ${JSON.stringify(result, null, 2)};
          result.forEach(chartItem => {
            const ctx = document.getElementById(chartItem.id);
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                    datasets: [
                        {
                            label: '# of Votes',
                            data: [12, 19, 3, 5, 2, 3],
                            borderWidth: 1,
                            fill: false
                        },
                        {
                            label: '# of Votes',
                            data: [4, 22, 31, 3, 5, 7],
                            borderWidth: 1,
                            fill: false
                        }
                    ]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        </script>
        `;
        const chartCnd = `
    <script src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.min.js'></script>
        
        `
        $('head').append(chartCnd)
        $('html').append(script);

        return this
    }
}



/**
 * 
 * EXECUTION
 */
const dom = new Template(htmlString)
const result = dom
    .processTable()
    .processImages()
    .processCharts()
    .getHtmlString()


fs.writeFileSync("result.html", result)