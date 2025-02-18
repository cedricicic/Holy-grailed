import React from 'react';
import '../css/read.css';


const HolyGrailed = () => {
    return (
      <div className="container">
        <p className="description">
          Aside from being a full-time math student, I also sell clothes on the side to earn some extra pocket change. I noticed that Grailed doesn’t provide many metrics—and when it does, the data isn’t very user-friendly. That’s why I created Holy Grailed: to help both sellers and buyers reach agreements more quickly. This application accepts an active Grailed listing URL, scrapes the top 30 related listings, and performs an in-depth analysis right before your eyes. This is a fun side project, not intended for commercial use.<b> Please use it responsibly and avoid overloading Grailed’s system. </b>
        </p>
        <p className="author">—Cedric</p>
      </div>
    );
};

export default HolyGrailed;
