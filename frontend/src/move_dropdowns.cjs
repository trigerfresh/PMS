const fs = require('fs');

const file = 'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/RevenueReport.jsx';
let content = fs.readFileSync(file, 'utf8');

const dropdownsCode = `                    <div className="d-flex gap-3">
                        <Dropdown align="start" onSelect={(val) => handleHotelChange({ target: { value: val } })}>
                            <Dropdown.Toggle variant="light" className="shadow-sm border-0 rounded-pill px-3">
                                {hotelId ? hotels.find(h => h.id == hotelId)?.hotel_name || 'All Hotels' : 'All Hotels'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="border-0 shadow-lg rounded-4 p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <div className="px-2 pb-2 mb-2 border-bottom">
                                    <input type="text" className="form-control form-control-sm rounded-pill" placeholder="Search..." onChange={(e) => setSearchHotel(e.target.value)} value={searchHotel} onClick={(e) => e.stopPropagation()} />
                                </div>
                                <Dropdown.Item eventKey="" active={hotelId === ''} onClick={() => setSearchHotel('')}>All Hotels</Dropdown.Item>
                                {hotels.filter(h => h.hotel_name.toLowerCase().includes(searchHotel.toLowerCase())).map((hotel) => (
                                    <Dropdown.Item key={hotel.id} eventKey={hotel.id.toString()} active={hotelId == hotel.id} onClick={() => setSearchHotel('')}>{hotel.hotel_name}</Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>

                        <Dropdown align="start" onSelect={(val) => handleBranchChange({ target: { value: val } })}>
                            <Dropdown.Toggle variant="light" className="shadow-sm border-0 rounded-pill px-3">
                                {branchId ? branches.find(b => b.id == branchId)?.branch_name || 'All Branches' : 'All Branches'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="border-0 shadow-lg rounded-4 p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <div className="px-2 pb-2 mb-2 border-bottom">
                                    <input type="text" className="form-control form-control-sm rounded-pill" placeholder="Search..." onChange={(e) => setSearchBranch(e.target.value)} value={searchBranch} onClick={(e) => e.stopPropagation()} />
                                </div>
                                <Dropdown.Item eventKey="" active={branchId === ''} onClick={() => setSearchBranch('')}>All Branches</Dropdown.Item>
                                {branches.filter(b => b.branch_name.toLowerCase().includes(searchBranch.toLowerCase())).filter(b => !hotelId || (hotels.find(h => h.id == hotelId)?.branch_id == b.id)).map((branch) => (
                                    <Dropdown.Item key={branch.id} eventKey={branch.id.toString()} active={branchId == branch.id} onClick={() => setSearchBranch('')}>{branch.branch_name}</Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>`;

// 1. Remove the dropdowns from the top section
// We'll use regex to remove the <Dropdown> blocks between <div className="d-flex flex-wrap gap-3 align-items-center"> and <div><Card className="shadow border-0 rounded-4" style={{ background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)'
const removeRegex = /<Dropdown align="end" onSelect=\{\(val\) => handleHotelChange\([\s\S]*?<\/Dropdown>\s*<Dropdown align="end" onSelect=\{\(val\) => handleBranchChange\([\s\S]*?<\/Dropdown>/;

content = content.replace(removeRegex, '');

// 2. Insert the dropdowns into the table header section
const searchDivRegex = /<div className="d-flex justify-content-end mb-3">/g;

content = content.replace(searchDivRegex, `<div className="d-flex flex-wrap justify-content-between align-items-center mb-3">\n${dropdownsCode}\n                    <div className="d-flex align-items-center mt-3 mt-md-0">`);

// Also need to close the inner div we just opened after the Form.Select
const selectEndRegex = /<\/Form\.Select>\s*<\/div>/;
content = content.replace(selectEndRegex, `</Form.Select>\n                        </div>\n                    </div>`);


fs.writeFileSync(file, content);
console.log('Moved dropdowns to the search section');
