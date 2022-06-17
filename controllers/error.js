exports.getPageNotFound = (req, res, next) => {
  res.status(404).render("404", { pageTitle: "Page Not Found", path: "/404" });
  //res.status(404).sendFile(path.join(__dirname,'views','404.html'))
};
exports.getError = (req, res, next) => {
    res.status(500).render("500", { pageTitle: "Error Page", path: "/500" });
    //res.status(404).sendFile(path.join(__dirname,'views','404.html'))
  };
  
