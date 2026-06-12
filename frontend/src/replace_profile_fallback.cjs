const fs = require('fs');

const files = [
    'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/TodayCheckIn.jsx',
    'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/TodayCheckOut.jsx',
    'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/RevenueReport.jsx'
];

const fallbackImg = `                                                        <img
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

    // Add import if not exists
    if (!content.includes('import dummy_user')) {
        content = content.replace(/(import React.*?)\n/, '$1\nimport dummy_user from \'./dummy_user.png\'\n');
    }

    // Replace the div fallback
    // We can use a regex to match the <div ...> ... </div> block inside the `) : (`
    
    // In these files, it's inside `) : (` and before `)}`
    // Let's match from <div className="bg-success bg-opacity-10 to </div>
    const divRegex = /<div\s+className="bg-success bg-opacity-10[^>]*>[\s\S]*?<\/div>/g;
    
    content = content.replace(divRegex, fallbackImg.trim());

    fs.writeFileSync(file, content);
}
console.log('Replaced profile image fallback with dummy_user.png');
