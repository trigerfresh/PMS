import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Row, Col } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';

const ViewBookingDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const viewData = location.state?.viewData;

  if (!viewData) {
    return (
      <Container fluid className="mt-4">
        <h4>No booking data found.</h4>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-white d-flex align-items-center">
          <Button variant="light" className="me-3" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </Button>
          <h4 className="mb-0">Booking Details</h4>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table bordered hover className="align-middle">
              <tbody>
                <tr>
                  <th style={{ width: '30%', backgroundColor: '#f8f9fa' }}>Guest Name</th>
                  <td>{viewData.guest_name}</td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Email</th>
                  <td>{viewData.guest_email || 'N/A'}</td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Phone</th>
                  <td>{viewData.guest_phone || 'N/A'}</td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Hotel Name</th>
                  <td>{viewData.hotel_name || 'N/A'}</td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Floor Name</th>
                  <td>{viewData.floor_name || 'N/A'}</td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Room No</th>
                  <td>{viewData.room_no || 'N/A'}</td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Room Type</th>
                  <td>{viewData.room_type || 'N/A'}</td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Status</th>
                  <td>
                    <span className={`badge ${viewData.status === 'Cancelled' ? 'bg-danger' : 'bg-success'}`}>
                      {viewData.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Payment</th>
                  <td>
                    <span className={`badge ${viewData.payment_status === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {viewData.payment_status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Check in date</th>
                  <td>{viewData.check_in_date?.split('T')[0]}</td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Check out date</th>
                  <td>{viewData.check_out_date?.split('T')[0]}</td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Total Days</th>
                  <td>
                    {Math.max(
                      1,
                      Math.ceil(
                        (new Date(viewData.check_out_date) - new Date(viewData.check_in_date)) /
                        (1000 * 60 * 60 * 24),
                      ),
                    )}
                  </td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Price Per Night</th>
                  <td>₹{viewData.price_per_day}</td>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa' }}>Total Amount</th>
                  <td>₹{viewData.total_amount}</td>
                </tr>
                {viewData.user_profile_pic && (
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Profile Picture</th>
                    <td>
                      <img
                        src={`http://localhost:5000/uploads/${viewData.user_profile_pic}`}
                        width="120"
                        alt="Profile"
                        style={{ borderRadius: '4px', objectFit: 'cover' }}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {/* OTHER GUESTS */}
            {(() => {
              let otherGuests = [];
              try {
                if (typeof viewData.other_guests === 'string') {
                  otherGuests = JSON.parse(viewData.other_guests);
                } else if (Array.isArray(viewData.other_guests)) {
                  otherGuests = viewData.other_guests;
                }
              } catch (e) {
                console.error('Error parsing other guests:', e);
              }

              if (otherGuests && otherGuests.length > 0) {
                return (
                  <div className="mt-4">
                    <h5 className="fw-bold mb-3 border-bottom pb-2">Other Guests</h5>
                    <Table bordered hover className="align-middle text-center">
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Profile</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otherGuests.map((g, idx) => (
                          <tr key={idx}>
                            <td>{g.guest_name || 'N/A'}</td>
                            <td>{g.guest_phone || 'N/A'}</td>
                            <td>{g.guest_email || 'N/A'}</td>
                            <td>
                              {g.profile_pic ? (
                                <img
                                  src={`http://localhost:5000/uploads/${g.profile_pic}`}
                                  width="40"
                                  height="40"
                                  alt="Guest Profile"
                                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                                />
                              ) : (
                                'N/A'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ViewBookingDetails;
