import React from 'react';

export default function AttendeeList({
  attendees,
}) {
  const attendeeIds = typeof attendees === 'object' && attendees !== null
    ? Object.keys(attendees)
    : [];

  return (
    <>
      {attendeeIds.length > 0 &&
        <div className="row">
          <div className="col">
            <h4>Attendee IDs</h4>
            <ul>
              {attendeeIds.map((id) => {
                return <li key={id}>{id}</li>
              })}
            </ul>
          </div>
        </div>
      }
    </>
  );
}
