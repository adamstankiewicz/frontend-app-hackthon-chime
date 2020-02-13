import React from 'react';

export default function AttendeeList({
  attendees,
}) {
  const users = typeof attendees === 'object' && attendees !== null
    ? Object.entries(attendees)
    : {};

  return (
    <>
      {users.length > 0 &&
        <div className="row mt-3">
          <div className="col">
            <h4>Attendees</h4>
            {users.map((user) => {
              const id = user[0];
              const details = user[1];
              return (
                <dl key={id}>
                  <dt>{id}</dt>
                  <dd>{JSON.stringify(details, null, 2)}</dd>
                </dl>
              );
            })}
          </div>
        </div>
      }
    </>
  );
}
