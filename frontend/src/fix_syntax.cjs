const fs = require('fs');

const files = [
    'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/TodayCheckIn.jsx',
    'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/TodayCheckOut.jsx',
    'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/RevenueReport.jsx'
];

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove the bad </div>
    content = content.replace(/className="shadow border-0 rounded-4"\s*<\/div>/g, 'className="shadow border-0 rounded-4"');

    // Add the missing </div> after the Card's closing div, but only if it's not already closed.
    // The pattern is: </Card> then </div> then </div> then <Card className="shadow-sm border-0 rounded-4 mb-4">
    // Since we only want to add </div> once, let's just find the exact block.
    
    // Check if the wrapper </div> is already there to prevent duplicate inserts
    if (!content.match(/<\/Card>\s*<\/div>\s*<\/div>\s*<\/div>\s*<Card className="shadow-sm border-0 rounded-4 mb-4">/)) {
        content = content.replace(/(<\/Card>\s*<\/div>)\s*(<\/div>\s*<Card className="shadow-sm border-0 rounded-4 mb-4">)/, '$1\n                </div>\n            $2');
    }

    fs.writeFileSync(file, content);
}
console.log('Fixed syntax errors');
