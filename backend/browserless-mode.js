const puppeteer = require("puppeteer");
require("dotenv").config();

const USE_BROWSERLESS = process.env.USE_BROWSERLESS === "true";
const BROWSERLESS_TOKEN = process.env.BROWSERLESS;

const launchBrowser = async () => {
  if (USE_BROWSERLESS && BROWSERLESS_TOKEN) {
    console.log("Using Browserless.io...");
    return await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`,
    });
  } else {
    console.log("Launching headless Puppeteer instance...");
    return await puppeteer.launch({
      headless: true, // Changed to true for headless operation
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Prevents crashes in Docker containers
        "--disable-gpu", // Optimize for headless 
        "--window-size=1920,1080" // Ensure large viewport
      ],
    });
  }
};

// Helper function to wait for selectors with timeout
const waitForSelector = async (page, selector, timeout = 5000) => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (e) {
    console.log(`Timed out waiting for selector: ${selector}`);
    return false;
  }
};

// Enhanced function to ensure page is fully loaded
const ensurePageLoaded = async (page, timeout = 10000) => {
  await page.waitForFunction(() => document.readyState === "complete", { timeout });
  
  // Wait a bit for React to render
  await page.waitForTimeout(1000);
  
  // Check if we need to intercept any anti-bot protection
  await handleAntiBotProtection(page);
};

// Handle any anti-bot protection that might be present
const handleAntiBotProtection = async (page) => {
  // Add custom headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  });
  
  // Check for common bot protection elements and handle them
  const protectionSelectors = [
    'iframe[src*="captcha"]',
    'iframe[src*="challenge"]',
    'div[class*="captcha"]',
    'div[id*="captcha"]'
  ];
  
  for (const selector of protectionSelectors) {
    if (await waitForSelector(page, selector, 500)) {
      console.log(`Detected possible bot protection: ${selector}`);
      // You might need to implement specific handling for each protection type
    }
  }
};

const getListingDetails = async (page) => {
  // Wait for key elements to be present before extracting data
  await Promise.race([
    waitForSelector(page, ".MainContent_price__RSyWC span", 5000),
    waitForSelector(page, ".MainContent_details__2FR05 h1", 5000)
  ]);
  
  return await page.evaluate(() => {
    const getTextContent = (selector) => {
      const element = document.querySelector(selector);
      return element ? element.textContent.trim() : "";
    };

    const elementExists = (selector) => {
      return document.querySelector(selector) !== null;
    };

    // Updated selectors - check for newer versions first, then fall back to old ones
    const selectors = {
      price: [".MainContent_price__RSyWC span", ".price span", "[data-cy='listing-price']"],
      discountedPrice: [".MainContent_price__RSyWC span.Price_onSale__qffVR", ".price span.on-sale", "[data-cy='listing-sale-price']"],
      condition: [".MainContent_details__2FR05 p:nth-child(6) > span", ".listing-details p:nth-child(6) > span", "[data-cy='listing-condition']"],
      description: [".MainContent_details__2FR05 h1", ".listing-details h1", "[data-cy='listing-title']"],
      likesCount: [".MainContent_saveLikes__Yq0PD button > span", ".save-likes button > span", "[data-cy='listing-likes']"],
      authenticBadge: [".AuthenticationBadge_clickable__HphPo span > span", ".authentication-badge span > span", "[data-cy='authentication-badge']"],
      originalPostingDate: [".Metadata_metadata__eYo0L > span:nth-child(2)", ".metadata > span:nth-child(2)", "[data-cy='listing-date']"],
      labelSelector: [".Details_designers__NnQ20 > a", ".designers > a", "[data-cy='designer-link']"],
      thumbnailContainer: [".Thumbnails_thumbnails__KvRoX.PhotoGallery_thumbnails__VlX1l", ".thumbnails", "[data-cy='listing-thumbnails']"]
    };

    // Helper function to try multiple selectors
    const getFirstMatch = (selectorArray, method) => {
      for (const selector of selectorArray) {
        if (method === 'exists') {
          if (elementExists(selector)) return true;
        } else {
          const content = getTextContent(selector);
          if (content) return content;
        }
      }
      return method === 'exists' ? false : "";
    };

    let price = getFirstMatch(selectors.discountedPrice);
    if (!price) {
      price = getFirstMatch(selectors.price);
    }

    const cond = getFirstMatch(selectors.condition);
    const description = getFirstMatch(selectors.description);
    const likesCount = getFirstMatch(selectors.likesCount);
    const authenticBadge = selectors.authenticBadge.some(sel => elementExists(sel));
    const originalPostingDate = getFirstMatch(selectors.originalPostingDate);

    const labels = [];
    for (const labelSelector of selectors.labelSelector) {
      const labelElements = document.querySelectorAll(labelSelector);
      labelElements.forEach((element) => {
        if (element && element.textContent.trim()) {
          labels.push(element.textContent.trim());
        }
      });
      if (labels.length > 0) break;
    }

    let imageCount = 0;
    for (const containerSelector of selectors.thumbnailContainer) {
      const container = document.querySelector(containerSelector);
      if (container) {
        imageCount = container.childElementCount;
        break;
      }
    }

    return {
      price,
      labels,
      cond,
      imageCount,
      description,
      likesCount,
      isAuthentic: authenticBadge,
      originalPostingDate,
    };
  });
};

const handlePopups = async (page) => {
  try {
    const popupSelectors = [
      "button:has-text('Accept')", 
      ".cookie-notice button",
      "[data-testid='close-button']",
      "button.close",
      "button[aria-label='Close']"
    ];
    
    for (const selector of popupSelectors) {
      const found = await waitForSelector(page, selector, 1000);
      if (found) {
        await page.evaluate((sel) => {
          document.querySelectorAll(sel).forEach((btn) => btn.click());
        }, selector);
        // Wait a moment after closing popup
        await page.waitForTimeout(500);
      }
    }
  } catch (e) {
    console.log("No popups detected or error handling them:", e.message);
  }
};

const applyFilter = async (page, filterType, value) => {
  if (!value) return;

  console.log(`Trying to apply ${filterType} filter: ${value}`);

  try {
    // Wait for filters to be available
    const filterSelectors = [
      ".filter-bottom", 
      "ul.-custom-refinements", 
      ".Collapsible-module__collapsibleContent___KpYrl",
      "[data-cy='filters']"
    ];
    
    let filtersReady = false;
    for (const selector of filterSelectors) {
      filtersReady = await waitForSelector(page, selector, 1000);
      if (filtersReady) break;
    }
    
    if (!filtersReady) {
      console.log("Filters not found within timeout");
      return;
    }

    if (filterType.toLowerCase() === "condition") {
      if (value.toLowerCase() === "new") {
        value = "new/ never worn";
      }

      const conditionFound = await page.evaluate(async (value) => {
        // Try multiple selector patterns for condition filters
        const possibleSelectors = [
          // Original selector
          "#feed > div > div.feed-and-filters > div.left > div > div:nth-child(7) > div.Collapsible_collapsibleContent__CZrnt > div > div > ul > li:nth-child({index}) > div > input",
          // More generic selectors
          ".filters-section:has(h3:contains('Condition')) input[value='{value}']",
          "[data-cy='condition-filter-{value}']",
          "input[name='condition'][value='{value}']",
          // Try finding by label text
          "label:contains('{value}') input"
        ];

        const conditionNames = [
          "new/ never worn",
          "gently used",
          "used",
          "very worn",
          "not specified",
        ];

        // Try to find condition filter with any selector pattern
        for (const baseSelector of possibleSelectors) {
          // Try direct value match first
          const valueSelector = baseSelector.replace('{value}', value.toLowerCase());
          const valueCheckbox = document.querySelector(valueSelector);
          
          if (valueCheckbox) {
            valueCheckbox.click();
            return true;
          }
          
          // Try indexed approach
          const conditionMap = {};
          conditionNames.forEach((name, idx) => {
            conditionMap[name.toLowerCase()] = baseSelector.replace('{index}', idx + 1);
          });

          const selector = conditionMap[value.toLowerCase()];
          if (!selector) continue;

          const checkbox = document.querySelector(selector);
          if (checkbox) {
            // If there's a collapsed section, expand it
            const collapsible = checkbox.closest(".Collapsible-module__collapsibleContent___KpYrl, [data-cy='collapsible-content']");
            if (collapsible) {
              const style = window.getComputedStyle(collapsible);
              if (style.height === "0px" || style.display === "none") {
                const trigger = collapsible.previousElementSibling;
                if (trigger) trigger.click();
                // Wait a moment for animation
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }

            if (!checkbox.checked) {
              checkbox.click();
              return true;
            }
            return true; // Already checked
          }
        }
        
        return false;
      }, value);

      if (conditionFound) {
        console.log(`Successfully applied condition filter: ${value}`);
        // Wait for page to update after filter
        await Promise.race([
          page.waitForNavigation({ timeout: 3000 }),
          page.waitForFunction('document.readyState === "complete"', { timeout: 3000 })
        ]).catch(() => {
          console.log("Timeout waiting for filter navigation - continuing");
        });
        
        // Additional wait for React to update the DOM
        await page.waitForTimeout(1000);
      } else {
        console.log(`Could not find condition filter option: ${value}`);
      }
    }
  } catch (e) {
    console.error(`Error applying ${filterType} filter:`, e);
  }
};

const gatherListingLinks = async (page) => {
  let listingLinks = [];
  let previousHeight = 0;
  let attempts = 0;
  const maxAttempts = 20;
  let noNewContentCount = 0;

  console.log("Starting to gather listing links...");

  // Add scroll helper
  await page.evaluate(() => {
    window.scrollBySmooth = (distance) => {
      window.scrollBy({
        top: distance,
        behavior: 'smooth'
      });
    };
  });

  // Try to fetch initial set of links
  await ensureReactContent(page);

  while (listingLinks.length < 100 && attempts < maxAttempts && noNewContentCount < 3) {
    attempts++;
    previousHeight = await page.evaluate("document.body.scrollHeight");
    
    // Scroll down smoothly to mimic human behavior
    await page.evaluate("window.scrollBySmooth(800)");
    await page.waitForTimeout(500);
    await page.evaluate("window.scrollBySmooth(800)");
    
    // Wait for new content to load
    try {
      await Promise.race([
        page.waitForFunction(
          `document.body.scrollHeight > ${previousHeight}`, 
          { timeout: 2000 }
        ),
        page.waitForFunction(
          `document.querySelectorAll('.feed-item a, .listing-item a, [data-cy="product-card"] a').length > ${listingLinks.length}`,
          { timeout: 2000 }
        )
      ]);
    } catch (e) {
      console.log("No new content loaded after scroll");
      noNewContentCount++;
    }

    // Extract all links
    const newLinks = await page.evaluate(() => {
      const selectors = [
        '.feed-item a', 
        '.listing-item a', 
        '[data-cy="product-card"] a',
        '.ProductList_card__7DL9f a'
      ];
      
      const allLinks = [];
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach(link => {
          if (link.href) allLinks.push(link.href);
        });
      }
      
      return allLinks.filter(
        href => 
          href.startsWith("https://www.grailed.com/listings/") &&
          !href.includes("/similar") &&
          href.match(/\/listings\/\d+-/)
      );
    });

    listingLinks = Array.from(new Set([...listingLinks, ...newLinks]));
    console.log(
      `Found ${listingLinks.length} unique valid listing links so far...`
    );

    if (newLinks.length === 0) {
      noNewContentCount++;
      if (noNewContentCount >= 3) {
        console.log("No new content found after multiple attempts, may have reached the end");
      }
    } else {
      noNewContentCount = 0;
    }
  }

  console.log(
    `Finished gathering links. Found ${listingLinks.length} unique valid listings.`
  );
  return listingLinks.slice(0, 20);
};

// Helper function to ensure React content is loaded
const ensureReactContent = async (page) => {
  console.log("Ensuring React content is loaded...");
  
  // Wait for key React elements to appear
  const reactSelectors = [
    '.feed-item', 
    '.listing-item', 
    '[data-cy="product-card"]',
    '.ProductList_card__7DL9f'
  ];
  
  // Try each selector
  for (const selector of reactSelectors) {
    if (await waitForSelector(page, selector, 2000)) {
      console.log(`React content loaded, found selector: ${selector}`);
      return true;
    }
  }
  
  // If no selectors found, try waiting a bit more and check for any relevant content
  console.log("No specific React content found, waiting for general page content...");
  await page.waitForTimeout(3000);
  
  const contentCount = await page.evaluate(() => {
    return document.querySelectorAll('a[href*="/listings/"]').length;
  });
  
  if (contentCount > 0) {
    console.log(`Found ${contentCount} listing links on page`);
    return true;
  }
  
  console.log("Warning: Could not confirm React content loaded properly");
  return false;
};

const scrapeListingDetails = async (browser, link) => {
  const detailPage = await browser.newPage();
  
  try {
    // Set a reasonable timeout
    await detailPage.setDefaultNavigationTimeout(30000);
    
    // Navigate to the listing page
    await detailPage.goto(link, { waitUntil: "networkidle2" });
    
    // Handle popups that might interfere
    await handlePopups(detailPage);
    
    // Ensure page is fully loaded
    await ensurePageLoaded(detailPage);
    
    // Extract listing details
    const data = await getListingDetails(detailPage);
    data.link = link;
    
    return data;
  } catch (e) {
    console.error(`Error scraping listing ${link}:`, e.message);
    return { link, error: e.message };
  } finally {
    await detailPage.close();
  }
};

const scrapeMultipleListings = async (browser, links, batchSize = 3) => {
  const results = [];
  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(links.length/batchSize)}`);
    
    const batchResults = await Promise.all(batch.map((link) => scrapeListingDetails(browser, link)));
    results.push(...batchResults);
    
    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < links.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return results;
};

const scrapeGrailedListing = async (listingUrl) => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36');
    
    console.log(`Navigating to listing: ${listingUrl}`);
    await page.goto(listingUrl, { waitUntil: "networkidle2", timeout: 30000 });
    
    // Handle any popups
    await handlePopups(page);
    
    // Ensure the page is fully loaded
    await ensurePageLoaded(page);
    
    console.log("Extracting listing details...");
    const originalListingDetails = await getListingDetails(page);
    originalListingDetails.link = listingUrl;

    const condition = originalListingDetails.cond;
    console.log(`Found listing condition: ${condition}`);

    // Navigate to category page using breadcrumbs
    console.log("Attempting to navigate to category page via breadcrumbs...");
    const hasBreadcrumb = await page.evaluate(() => {
      // Try multiple selectors for breadcrumbs
      const selectors = [
        "nav.Breadcrumbs_breadcrumbs__9ol0k ol", 
        ".breadcrumbs ol",
        "[data-cy='breadcrumbs'] ol",
        "ol.breadcrumb"
      ];
      
      for (const selector of selectors) {
        const ol = document.querySelector(selector);
        if (!ol) continue;
        
        const links = Array.from(ol.querySelectorAll('li a')).filter(a => a.href && !a.href.includes('/listings/'));
        if (links.length >= 1) {
          console.log(`Found breadcrumb, clicking: ${links[links.length - 1].textContent}`);
          links[links.length - 1].click();
          return true;
        }
      }
      return false;
    });

    if (!hasBreadcrumb) {
      console.log("Warning: Could not find a valid category breadcrumb link");
      console.log("Trying alternative approach to get similar items...");
      
      // Alternative: try to find "Similar Items" or "Related" section
      const hasSimilarLink = await page.evaluate(() => {
        // Check for similar items section
        const similarSelectors = [
          "a:contains('Similar')", 
          "a:contains('Related')",
          "a[href*='/similar']",
          "[data-cy='similar-items'] a"
        ];
        
        for (const selector of similarSelectors) {
          const links = document.querySelectorAll(selector);
          for (const link of links) {
            if (link.href && !link.href.includes('/listings/')) {
              link.click();
              return true;
            }
          }
        }
        return false;
      });
      
      if (!hasSimilarLink) {
        throw new Error("Could not find a way to navigate to similar items");
      }
    }

    // Wait for navigation to complete
    await Promise.race([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }),
      page.waitForFunction('document.readyState === "complete"', { timeout: 10000 })
    ]).catch((e) => {
      console.log("Navigation timeout, continuing anyway:", e.message);
    });
    
    // Make sure the page has loaded
    await ensurePageLoaded(page);
    
    console.log("Checking for filter sections...");
    await Promise.race([
      waitForSelector(page, ".filter-bottom", 3000),
      waitForSelector(page, ".browse-grid", 3000),
      waitForSelector(page, ".FiltersInstantSearch", 3000),
      waitForSelector(page, "[data-cy='filters']", 3000)
    ]);

    // Apply condition filter if found
    if (condition) {
      console.log(`Applying condition filter: ${condition}`);
      await applyFilter(page, "condition", condition);
    }

    // Gather listing links
    console.log("Gathering similar listing links...");
    const listingLinks = await gatherListingLinks(page);
    
    if (listingLinks.length === 0) {
      console.log("Warning: No listing links found. Taking a screenshot for debugging.");
      await page.screenshot({ path: 'debug-no-listings.png' });
    }

    // Scrape details for each listing
    console.log(`Scraping details for ${listingLinks.length} related listings...`);
    const results = await scrapeMultipleListings(browser, listingLinks, 3);

    await browser.close();
    return { originalListingDetails, relatedListings: results };
  } catch (error) {
    console.error("Error in main scraping process:", error);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'error-screenshot.png' });
    
    await browser.close();
    throw error;
  }
};

module.exports = scrapeGrailedListing;