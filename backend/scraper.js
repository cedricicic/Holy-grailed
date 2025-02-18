const puppeteer = require("puppeteer");

const getListingDetails = async (page) => {
    return await page.evaluate(() => {
      const getTextContent = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : "";
      };
  
      const elementExists = (selector) => {
        return document.querySelector(selector) !== null;
      };

      const selectors = {
        price: ".MainContent_price__RSyWC span",
        discountedPrice: ".MainContent_price__RSyWC span.Price_onSale__qffVR",
        condition: ".MainContent_details__2FR05 p:nth-child(6) > span",
        description: ".MainContent_details__2FR05 h1",
        likesCount: ".MainContent_saveLikes__Yq0PD button > span",
        authenticBadge: ".AuthenticationBadge_clickable__HphPo span > span",
        originalPostingDate: ".Metadata_metadata__eYo0L > span:nth-child(2)",
        labelSelector: ".Details_designers__NnQ20 > a",
        thumbnailContainer: ".Thumbnails_thumbnails__KvRoX.PhotoGallery_thumbnails__VlX1l",
        colour: "p:nth-of-type(4) span.Details_value__S1aVR",
      };
  
      let price = "";
      const discountedPrice = getTextContent(selectors.discountedPrice);
  
      if (discountedPrice) {
        price = discountedPrice;
      } else {
        price = getTextContent(selectors.price);
      }
  
      const cond = getTextContent(selectors.condition);
      const description = getTextContent(selectors.description);
      const colour = getTextContent(selectors.colour);
      const likesCount = getTextContent(selectors.likesCount);
      const authenticBadge = elementExists(selectors.authenticBadge);
      const originalPostingDate = getTextContent(selectors.originalPostingDate);
  
      const labels = [];
      const labelElements = document.querySelectorAll(selectors.labelSelector);
      labelElements.forEach((element) => {
        if (element && element.textContent.trim()) {
          labels.push(element.textContent.trim());
        }
      });
  
      const container = document.querySelector(selectors.thumbnailContainer);
      const imageCount = container ? container.childElementCount : 0;
  
      return {
        price,
        labels,
        cond,
        imageCount,
        description,
        likesCount,
        isAuthentic: authenticBadge,
        originalPostingDate,
        colour,
      };
    });
  };
  
  const handlePopups = async (page) => {
      try {
        await page
          .waitForFunction(
            () => {
              const possiblePopups = [
                document.querySelector('button:has-text("Accept")'),
                document.querySelector('button:has-text("Accept All")'),
                document.querySelector('button:has-text("I Accept")'),
                document.querySelector(".cookie-notice button"),
    
                document.querySelector(".auth-wall"),
                document.querySelector(".login-modal"),
    
                document.querySelector(".newsletter-popup .close"),
                document.querySelector(".modal .close-button"),
              ];
    
              for (const popup of possiblePopups) {
                if (popup && popup.offsetParent !== null) {
                  popup.click();
                  return true;
                }
              }
    
              return false;
            },
            { timeout: 1000 }
          )
          .catch(() =>
            console.log("No popups detected or timed out waiting for them")
          );
    
        await page.mouse.click(50, 50);
    
        console.log("Popup handling complete");
      } catch (e) {
        console.log("Error in popup handling:", e.message);
      }
    };
  
    const applyFilter = async (page, filterType, value) => {
      if (!value) return;
    
      console.log(`Trying to apply ${filterType} filter: ${value}`);
    
      try {
        await page.waitForSelector(
          ".filter-bottom, ul.-custom-refinements, .Collapsible-module__collapsibleContent___KpYrl",
          {
            timeout: 500,
          }
        );
    
        if (filterType.toLowerCase() === "condition") {
          if (value.toLowerCase() === "new") {
            value = "new/ never worn";
          }
    
          const conditionFound = await page.evaluate(async (value) => {
            const baseSelector =
              "#feed > div > div.feed-and-filters > div.left > div > div:nth-child(7) > div.Collapsible_collapsibleContent__CZrnt > div > div > ul > li:nth-child({index}) > div > input";
    
            const conditionNames = [
              "new/ never worn",
              "gently used",
              "used",
              "very worn",
              "not specified",
            ];
    
            const conditionMap = {};
            conditionNames.forEach((name, idx) => {
              conditionMap[name.toLowerCase()] = baseSelector.replace("{index}", idx + 1);
            });
    
            const selector = conditionMap[value.toLowerCase()];
            if (!selector) return false;
    
            const conditionSection = document
              .querySelector(selector)
              .closest(".Collapsible-module__collapsibleContent___KpYrl");
            if (conditionSection) {
              const style = window.getComputedStyle(conditionSection);
              if (style.height === "0px" || style.display === "none") {
                const trigger = conditionSection.previousElementSibling;
                if (trigger) trigger.click();
    
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }
    
            const checkbox = document.querySelector(selector);
            if (checkbox && !checkbox.checked) {
              checkbox.click();
              return true;
            }
            return false;
          }, value);
    
          if (conditionFound) {
            console.log(`Successfully applied condition filter: ${value}`);
    
            await page.waitForNavigation({ timeout: 500 }).catch(() => {});
          } else {
            console.log(`Could not find condition filter option: ${value}`);
          }
          return;
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
  
    console.log("Starting to gather listing links...");
  
    while (listingLinks.length < 100 && attempts < maxAttempts) {
      attempts++;
      previousHeight = await page.evaluate("document.body.scrollHeight");
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
  
      await page
        .waitForFunction(
          `document.body.scrollHeight > ${previousHeight} || document.querySelectorAll('.feed-item a, .listing-item a').length > ${listingLinks.length}`,
          { timeout: 500 }
        )
        .catch(() => {});
  
      const newHeight = await page.evaluate("document.body.scrollHeight");
      const newLinks = await page.$$eval(
        ".feed-item a, .listing-item a",
        (links) =>
          links
            .map((link) => link.href)
            .filter(
              (href) =>
                href.startsWith("https://www.grailed.com/listings/") &&
                !href.includes("/similar") &&
                href.match(/\/listings\/\d+-/)
            )
      );
  
      listingLinks = Array.from(new Set([...listingLinks, ...newLinks]));
      console.log(
        `Found ${listingLinks.length} unique valid listing links so far...`
      );
  
      if (newHeight === previousHeight) {
        console.log("No new content loaded, may have reached the end of results");
        if (listingLinks.length < 10) {
          console.log("Waiting a bit more to see if more results load...");
          await page
            .waitForFunction(
              `document.querySelectorAll('.feed-item a, .listing-item a').length > ${listingLinks.length}`,
              { timeout: 500 }
            )
            .catch(() => {});
          continue;
        } else {
          break;
        }
      }
    }
  
    console.log(
      `Finished gathering links. Found ${listingLinks.length} unique valid listings.`
    );
    return listingLinks.slice(0, 30);
  };

const scrapeListingDetails = async (browser, link) => {
  const detailPage = await browser.newPage();
  await detailPage.goto(link, { waitUntil: "networkidle2" });
  await detailPage.waitForFunction(() => document.readyState === "complete", { timeout: 500 }).catch(() => {});
  const data = await getListingDetails(detailPage);
  data.link = link;
  await detailPage.close();
  return data;
};

const scrapeMultipleListings = async (browser, links, batchSize = 5) => {
  const results = [];
  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((link) => scrapeListingDetails(browser, link)));
    results.push(...batchResults);
  }
  return results;
};

const scrapeGrailedListing = async (listingUrl) => {
  const browser = await puppeteer.launch({
    headless: false, 
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    await page.goto(listingUrl, { waitUntil: "networkidle2" });
    await handlePopups(page);
    const originalListingDetails = await getListingDetails(page);
    originalListingDetails.link = listingUrl;

    const condition = originalListingDetails.cond;

    const hasBreadcrumb = await page.evaluate(() => {
      const ol = document.querySelector("nav.Breadcrumbs_breadcrumbs__9ol0k ol, .breadcrumbs ol");
      if (!ol) return false;
      const links = Array.from(ol.querySelectorAll('li a')).filter(a => a.href && !a.href.includes('/listings/'));
      if (links.length >= 1) {
        links[links.length - 1].click();
        return true;
      }
      return false;
    });

    if (!hasBreadcrumb) throw new Error("Could not find a valid category breadcrumb link");

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 5000 }).catch(() => {});
    await page.waitForSelector(".filter-bottom, .browse-grid, .FiltersInstantSearch", { timeout: 2000 }).catch(() => {});

    if (condition) await applyFilter(page, "condition", condition);

    const listingLinks = await gatherListingLinks(page);
    const results = await scrapeMultipleListings(browser, listingLinks, 5);

    await browser.close();

    return { originalListingDetails, relatedListings: results };
  } catch (error) {
    await browser.close();
    throw error;
  }
};

module.exports = scrapeGrailedListing;