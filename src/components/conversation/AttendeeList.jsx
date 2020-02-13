import React from 'react';

export default function AttendeeList({
  users,
}) {
  return (
    <div className="row mt-3">
      {users.length > 0 &&
        <div className="row">
          <div className="col">
            <h4>Attendee IDs</h4>
            <ul>
              {users.map((user) => {
                return <li key={user.attendeeId}>{user.attendeeId}</li>
              })}
            </ul>
          </div>
        </div>
      }
    </div>
  );
}
