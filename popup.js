// popup.js
function executeContentScript() {
    if (typeof browser !== 'undefined') {
        // Firefox
        browser.tabs.query({ active: true, currentWindow: true })
            .then(tabs => {
                return browser.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: getWordCountList
                });
            })
            .then(results => {
                console.log(results);
                document.getElementById('results').innerHTML = results[0].result;
            })
            .catch(error => console.error('Error:', error));
    } else {
        // Chrome
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: getWordCountList
            }, results => {
                document.getElementById('results').textContent = '';
                document.getElementById('results').appendChild(
                    new DOMParser().parseFromString(results[0].result, 'text/html').body.firstChild
                );
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', executeContentScript);

function getWordCountList() {


    const body = document.body.innerText;
    const linebreaks = locations('\n\n', body);

    const semicolons = locations(':', body);

    const colonsFiltered = removePreLowerCase(body, semicolons);

    const list = extractCharacterWords(body, colonsFiltered);

    const formattedList = formatList(list);
    return formattedList;


    function formatList(list) {
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';

        for (const key in list) {
            const li = document.createElement('li');
            const strong = document.createElement('strong');
            strong.textContent = key;
            li.appendChild(strong);
            li.appendChild(document.createTextNode(` ${list[key]}`));
            ul.appendChild(li);
        }

        return ul.outerHTML;
    }

    function extractCharacterWords(body, semiColonPositions) {
        const list = {};
        for (let i = 0; i < semiColonPositions.length; i++) {
            const x = i;
            const name = getName(body, semiColonPositions[i], 30);

            if (list[name] == undefined) {
                list[name] = 0;
            }
            const offset = semiColonPositions[i];
            const amount = semiColonPositions[i + 1] - semiColonPositions[i];
            const wordCount = countWords(body.substr(offset, amount)) - 1; // -1 since the last word before the next : will be a name of a character
            list[name] += wordCount;
        }
        return list;
    }

    function countWords(text) {
        const spaces = locations(' ', text).length;
        const linebreaks = locations('\n\n', text).length;
        return spaces + linebreaks;
    }

    function getName(body, start, limit) {
        let name = "";
        for (let i = start; i > start - limit; i--) {
            if (body[i] == '\n') {
                break;
            } else {
                name += body[i];
            }
        }
        return reverseString(name);
    }

    function reverseString(str) {
        return str.split('').reduce((reversed, character) => character + reversed, '');
    }

    function removeLower(replies, start, offset = 0) {
        return replies.filter(x => x >= start + offset);
    }

    function removePreLowerCase(body, arr) {
        return arr.filter(index => {
            // Extract the potential name before the colon
            let start = index;
            while (start > 0 && body[start - 1] !== '\n') {
                start--;
            }
            const name = body.substring(start, index);

            // Check if the name is in uppercase (allowing spaces and perhaps some punctuation)
            return /^[A-Z\s\-]*$/.test(name);
        });
    }

    function checkUpperCase(char) {
        return char == char.toUpperCase();
    }

    function locations(substring, string) {
        const indices = [];
        let pos = 0;
        while ((pos = string.indexOf(substring, pos)) !== -1) {
            indices.push(pos);
            pos += substring.length; // Move past the last found position to avoid infinite loops
        }
        return indices;
    }
}
