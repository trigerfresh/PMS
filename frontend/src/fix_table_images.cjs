const fs = require('fs');

const files = [
    'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/TodayCheckOut.jsx',
    'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/RevenueReport.jsx'
];

const incorrectFallback = `                                        <img
                                            src={dummy_user}
                                            alt="profile"
                                            className="rounded-circle shadow"
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'cover',
                                            }}
                                        />`;

const correctTableFallback = `                                                        <img
                                                            src={dummy_user}
                                                            alt="Dummy User"
                                                            width="50"
                                                            height="50"
                                                            style={{
                                                                objectFit: 'cover',
                                                                borderRadius: '4px',
                                                            }}
                                                        />`;

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace ONLY the first occurrence (which is inside the table)
    // We don't use the /g flag so it only replaces the first match.
    // Wait, the regex might be tricky with whitespace. Let's match it using index.
    
    // Find the first index of 'width: \'120px\','
    let firstIndex = content.indexOf(`src={dummy_user}`);
    
    // Wait, to be safe, let's use replace_file_content tool directly or a simple string replace.
    // String replace without /g only replaces the first occurrence!
    
    // We need to match the actual block. Let's use regex without /g.
    const regex = /<img\s+src=\{dummy_user\}\s+alt="profile"\s+className="rounded-circle shadow"\s+style=\{\{\s*width:\s*'120px',\s*height:\s*'120px',\s*objectFit:\s*'cover',\s*\}\}\s*\/>/;
    
    content = content.replace(regex, correctTableFallback.trim());

    fs.writeFileSync(file, content);
}
console.log('Fixed table profile image sizes');
