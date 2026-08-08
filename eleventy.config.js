export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/vendor": "vendor" });
  eleventyConfig.addPassthroughCopy({ "src/scripts": "scripts" });
  eleventyConfig.addPassthroughCopy({ "src/styles": "styles" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  // Passed through unprocessed: animated GIF and the (now-unused, but
  // harmless to keep) contact-spinner SVG. Neither is a good fit for
  // eleventy-img's raster resize/format pipeline (Task 11).
  eleventyConfig.addPassthroughCopy({ "src/images/ap-intro.gif": "images/ap-intro.gif" });
  eleventyConfig.addPassthroughCopy({ "src/images/contact-spinner.svg": "images/contact-spinner.svg" });
  // CSS background-image banners: passed through unprocessed too, since
  // main.css is a static file with no build step (see design spec) and
  // can't reference build-time-generated optimized filenames.
  eleventyConfig.addPassthroughCopy({
    "src/images/banner-mobile-hillrom.jpg": "images/banner-mobile-hillrom.jpg",
    "src/images/banner-mobile-ssa.jpg": "images/banner-mobile-ssa.jpg",
    "src/images/banner-mobile-artistprofile.jpg": "images/banner-mobile-artistprofile.jpg",
    "src/images/banner-mobile-hta.jpg": "images/banner-mobile-hta.jpg",
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
}
