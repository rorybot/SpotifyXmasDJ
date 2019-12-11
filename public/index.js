

var view = {
  title: "Joe",
  calc: function () {
    return 2 + 4;
  }
};

var output = Mustache.render("{{title}} spends {{calc}}", view);

var template = "{{title}} spends {{calc}}";

var html = mustache.to_html(template, view);
