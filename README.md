# Vanilla-Accordions
a javascript + css library for accordions, without any runtime dependencies like jQuery

---
# About

Vanilla Accordions is an accordion library written in plain-old vanilla javascript. There are no dependencies, no jQuery needed, completely framework-agnostic. It uses [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) to create a "native" accordion that _just works_. Here's an example of how easy it is to create an accordion:

```html
<accordion-element data-title="Here's an accordion">
  <!-- everything you want in your accordion goes here -->
</accordion-element>
```

# Why
To be completely honest, I was bored and wanted to start a side project. I saw that there is an excellent accordion library called [AccordionJS](https://github.com/awps/Accordion.JS), but it depends on jQuery. After a quick search I didn't find any pure vanilla JS accordion libraries that use modern web technologies, so I decided to build one.

# Features
- easy-to-use syntax - just plop in the js and css files into your project, add them to your html page, and use the `<accordion-element>` to create an accordion
- easy to customize - styles are provided in both less _and_ css, with some pre-created css variables to help customize your accordions
- tiny - combined, the minified sources are just over 1.5kb when gZipped
- supports nested accordions and accordion groups - accordions can be grouped with a `data-group` attribute so that only those in the same group close when one is opened, allowing for nested accordions
- auto-update accordion title and body - using class setters, an accordion's title and contents can be updated without you having to touch the dom, making changes to the accordion as simple as a single line of code

Want to check it out? click [this link](https://ploiu.github.io/Vanilla-JS-Accordions/) and try out the demo page. 
