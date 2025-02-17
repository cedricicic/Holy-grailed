import React from 'react'
import RecentSearches from "./RecentSearches"

const RecentlyViewed = () => {
    return (
        <section>
          <h3>Recently Viewed</h3>
          <div>
            <RecentSearches />
            <RecentSearches />
            <RecentSearches />
            <RecentSearches />
            <RecentSearches />
          </div>
        </section>
      );
    };

export default RecentlyViewed