const fs = require('fs')
const cheerio = require('cheerio');
const config = require('./config.json')
const htmlString = fs.readFileSync(config.htmlFile)
console.log(htmlString, "HEllllo")

/**
 * 
 * FUNCTIONS DEFINITION
 */

const loadDOM = (htmlString) => {
    // Load the input HTML with cheerio
    const $ = cheerio.load(htmlString);
    return $
}

/**
 * 
 * @param {*} $ DOM
 * @returns {htmlString, newDOM}
 */
const processTable = ($) => {
    const loopRow = $('tr:contains("[loop]")');

    if (loopRow.length === 0) {
        console.log('[loop] row not found.');
        return $.html()
    }

    // Insert {{#each items}} after the removed loop row
    loopRow.after('{{#each items}}');
    loopRow.remove();

    // Get the last child of <table>
    const lastChild = $('tbody').children().last();

    // Append {{/each}} before the last child
    lastChild.after('{{/each}}');


    return {
        htmlString: $.html(),
        $
    }

}

/**
 * 
 * @param {*} $ DOM
 * @returns {htmlString, newDOM}
 */
const processImages = $ => {
    $('img[src]').each(function () {
        const originalSrc = $(this).attr('src');
        const newSrc = `{{asset '${originalSrc}' 'dataURI'}}`;

        // Replace the "src" attribute with the new value
        $(this).attr('src', newSrc);
    });

    return {
        htmlString: $.html(),
        $
    }
}

/**
 * 
 * EXECUTION
 */
const $ = loadDOM(htmlString)

let result
result = processTable($)
result = processImages(result.$)

fs.writeFileSync("result.html", result.htmlString)