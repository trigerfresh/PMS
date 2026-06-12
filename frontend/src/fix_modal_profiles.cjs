const fs = require('fs');

const files = [
    'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/TodayCheckOut.jsx',
    'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/RevenueReport.jsx'
];

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Fix the main guest fallback: replace the 50x50 dummy_user image with the 120x120 dummy_user image.
    // The incorrect fallback looks like:
    // <img
    //     src={dummy_user}
    //     alt="Dummy User"
    //     width="50"
    //     height="50"
    //     style={{
    //         objectFit: 'cover',
    //         borderRadius: '4px',
    //     }}
    // />
    // inside the modal, after `className="rounded-circle shadow"`. We can just find that specific block and replace it.
    // Wait, since we know it comes after `) : (` inside the `Col md={4} className="text-center"`:
    const mainGuestFixRegex = /\) : \(\s*<img\s*src=\{dummy_user\}\s*alt="Dummy User"\s*width="50"\s*height="50"\s*style=\{\{\s*objectFit:\s*'cover',\s*borderRadius:\s*'4px',\s*\}\}\s*\/>\s*\)\}/g;
    
    const correctMainGuest = `) : (
                                        <img
                                            src={dummy_user}
                                            alt="profile"
                                            className="rounded-circle shadow"
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    )}`;

    content = content.replace(mainGuestFixRegex, correctMainGuest);

    // Replace the other guest fallback:
    // It's the `bg-secondary` div
    const otherGuestRegex = /<div\s+className="bg-secondary bg-opacity-10[^>]*>[\s\S]*?<\/div>/g;
    const otherGuestImg = `<img
                                                                            src={dummy_user}
                                                                            width="40"
                                                                            height="40"
                                                                            alt="Guest Profile"
                                                                            className="rounded-circle shadow-sm"
                                                                            style={{ objectFit: 'cover' }}
                                                                        />`;

    content = content.replace(otherGuestRegex, otherGuestImg);

    fs.writeFileSync(file, content);
}
console.log('Fixed modal profile images for other files');
