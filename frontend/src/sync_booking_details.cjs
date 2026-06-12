const fs = require('fs');

const file = 'c:/Users/admin/Desktop/ecolods/PMS/frontend/src/pages/BookingDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the count and filter logic.
const newLogic = `
      const isAboutToCheckout = (checkOutDate, status) => {
        if (!checkOutDate) return false;
        const s = status?.toLowerCase().trim();
        if (s !== 'booked') return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkout = new Date(checkOutDate);
        checkout.setHours(0, 0, 0, 0);
        const diffDays = (checkout - today) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 1;
      };

      const getCheckoutStatus = (checkOutDate, status) => {
        if (!checkOutDate) return null;
        const s = status?.toLowerCase().trim();
        if (s !== 'booked') return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkout = new Date(checkOutDate);
        checkout.setHours(0, 0, 0, 0);
        const diffDays = (checkout - today) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) return 'overdue';
        if (diffDays <= 1 && diffDays >= 0) return 'soon';
        return null;
      };

      const now = new Date()
      const todayString = now.toISOString().split('T')[0]
      const normalize = (s) => (s || '').toLowerCase().replace(/\\s+/g, '')

      const activeBookings = hotelBookings;

      let counts = {
        total: activeBookings.length + hotelDeleted.length,
        booked: activeBookings.filter(b => b.status?.toLowerCase().trim() === 'booked' && b.check_in_date?.split('T')[0] === todayString).length,
        reserved: activeBookings.filter(b => b.status?.toLowerCase().trim() === 'reserved').length,
        cancelled: activeBookings.filter(b => b.status?.toLowerCase().trim() === 'cancelled').length,
        soon: activeBookings.filter(b => isAboutToCheckout(b.check_out_date, b.status)).length,
        overdue: activeBookings.filter(b => getCheckoutStatus(b.check_out_date, b.status) === 'overdue').length,
        deleted: hotelDeleted.length,
        checkedout: activeBookings.filter(b => b.status?.toLowerCase().trim() === 'checkedout').length,
      }

      setOverallCounts(counts)

      let data = []

      if (statusType === 'maintenance') {
        data = hotelRooms.filter((room) => normalize(room.status) === 'maintenance')
      } else if (statusType === 'deleted') {
        data = hotelDeleted.map(d => ({ ...d, status: 'deleted' }))
      } else if (statusType === 'all') {
        data = activeBookings
      } else {
        data = activeBookings.filter((b) => {
          const status = normalize(b.status)

          if (statusType === 'booked') {
             return b.status?.toLowerCase().trim() === 'booked' && b.check_in_date?.split('T')[0] === todayString;
          }

          if (statusType === 'checkedout') {
            return status === 'checkedout'
          }

          if (statusType === 'checkout_soon') {
            const isSoon = isAboutToCheckout(b.check_out_date, b.status);
            if (isSoon) b.displayStatus = 'Checkout Soon'
            return isSoon
          }

          if (statusType === 'checkout_overdue') {
            const isOverdue = getCheckoutStatus(b.check_out_date, b.status) === 'overdue';
            if (isOverdue) {
              const todayObj = new Date();
              todayObj.setHours(0, 0, 0, 0);
              const checkOutDate = new Date(b.check_out_date);
              checkOutDate.setHours(0, 0, 0, 0);
              const diffTime = todayObj.getTime() - checkOutDate.getTime();
              const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
              b.displayStatus = \`Overdue (\${diffDays} day\${diffDays > 1 ? 's' : ''})\`;
              b.statusTypeForColor = 'checkoutoverdue';
            }
            return isOverdue
          }

          return status === normalize(statusType)
        })
      }
`;

// Locate where to replace.
const startMarker = `      const now = new Date()`;
const endMarker = `      setBookings(data)`;

let startIndex = content.indexOf(startMarker);
let endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    let pre = content.substring(0, startIndex);
    let post = content.substring(endIndex);
    
    content = pre + newLogic + '\n' + post;
    
    // Also, we need to update the initial state of overallCounts in BookingDetails.jsx
    content = content.replace(/vacant: 0/, 'checkedout: 0');
    
    // And we need to change the "VACANT" badge to route to "checkedout" and show "VACANT" text
    content = content.replace(/<Badge pill bg="success" className="p-2 px-3 shadow-sm fs-6" onClick=\{.. navigate\(\`\/booking-details\/\$\{hotelId \|\| 'all'\}\/vacant\`\)\}>VACANT \{overallCounts.vacant\}<\/Badge>/g, 
        '<Badge pill bg="success" className="p-2 px-3 shadow-sm fs-6" onClick={() => navigate(`/booking-details/${hotelId || \'all\'}/checkedout`)}>VACANT {overallCounts.checkedout}</Badge>');

    // Wait, the badges are actually rendered as divs now:
    // Let's replace the Vacant div block.
    // The vacant block looks like:
    /*
        {/* Vacant *}
        <div 
          onClick={() => navigate(\`/booking-details/\${hotelId}/vacant\`)}
          style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
          className={\`px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 \${statusType === 'vacant' ? 'bg-success text-white' : 'bg-white text-success'}\`}
        >
          <span className="fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Vacant</span>
          <span className={\`badge \${statusType === 'vacant' ? 'bg-white text-success' : 'bg-success'} rounded-pill\`} style={{ fontSize: '0.65rem' }}>{overallCounts.vacant}</span>
        </div>
    */
    
    content = content.replace(
        /onClick=\{\(\) => navigate\(\`\/booking-details\/\$\{hotelId\}\/vacant\`\)\}/g,
        'onClick={() => navigate(`/booking-details/${hotelId}/checkedout`)}'
    );
    content = content.replace(
        /statusType === 'vacant'/g,
        "statusType === 'checkedout'"
    );
    content = content.replace(
        /overallCounts\.vacant/g,
        "overallCounts.checkedout"
    );

    fs.writeFileSync(file, content);
    console.log("Updated BookingDetails logic.");
} else {
    console.log("Markers not found.");
}
