# Enhanced HTML elements with query/event methods

Utility functions to easily perform DOM element manipulation:

- Element selection based on css query selectors. Chainable. NodeLists automatically converted as Arrays
- Helpers to Attach/detach events. Event delegation supported

This library is provided as an ES module with Typescript declarations.

## Install

Install with npm:

```ts
$ npm install @drivy/dom-query
```

Install with pnpm:

```ts
$ pnpm install @drivy/dom-query
```

Install with yarn:

```ts
$ yarn add @drivy/dom-query
```

## Usage

```ts
import { query, queryAll } from "@drivy/dom-query";

queryAll(".home-header").map(header => console.log(header));
// => <h1 class="home-header"> Welcome </h1>
// => <h1 class="home-header"> Get started </h1>

query(".confirm-button").on("click", e => {
  confirm(e.target);
});
```

## API

### Get elements from the DOM

`query`

- selects an element from the DOM with a css query selector.
- returns `null` if no element matches the selector.
- chainable. Chained method will be based on the last selected element context

`queryStrict`

- like `query` method but will raise en exception if no element matches the selector.

`queryAll`

- selects a list of elements from the DOM with a css query selector. NodeList results will be converted to Arrays so you can directly access Array methods (forEach, map, reduce, filter...)

Examples:

```ts
import { query, queryStrict, queryAll } from "@drivy/dom-query"
...
const myElement = query(".js_my-element")
const mySubElement = myElement.query(".js_my-sub-element")
const mySubElements = myElement.queryAll(".js_my-sub-elements")

queryAll(".js_my-container .js_my-children-to-select").map(enhancedElement => {
  doSomething(enhancedElement)
})

const myElement2 = queryStrict(".js_my-existing-element")
//code below won't be reached if the previous element was not found
doSomething(myElement2)

```

### Transform existing javascript elements to EnhancedHTMLElements

You can transform an existing javascript Element/List of Elements to an EnhancedHTMLElement/EnhancedHTMLElementList with the following methods:

- `toEnhancedHTMLElement`
- `toEnhancedHTMLElementList`

You have to use those methods when input elements are out of your scope (function args, event.target ...)

```ts
import { toEnhancedHTMLElement, toEnhancedHTMLElementList } from "@drivy/dom-query"
...

const myElement = toEnhancedHTMLElement(myHTMLElement);
const myElements = toEnhancedHTMLElementList(myHTMLElements);
```

### Handle events

You can attach/detach events with the following methods:

EnhancedHTMLElement`.on`

- attaches event like native `target.addEventListener`.
- returns a "detach" function. When called, will remove the event listener like `target.removeEventListener`.

EnhancedHTMLElementList`.on`

- same parameters and behavior than EnhancedHTMLElement`.on` but the event will be attached on each element contained in the list.
- returns a "detach" function that when called will detach the events attached on each element of the list

EnhancedHTMLElement`.onDelegate`

- does event delegation. [pattern description here](https://davidwalsh.name/event-delegate).
- like `.on` method but takes an extra parameter (first one) as a css query selector to specify the children to use as event targets
- returns a "detach" function. When called, will remove the event listener attached to the container.

EnhancedHTMLElementList`.onDelegate`

- same parameters and behavior than EnhancedHTMLElement`.onDelegate` but the event delegation will be done for each element of the list.
- returns a "detach" function that when called will detach the events attached on each element of the list

Examples:

```ts
// EnhancedHTMLElement

const detach = myElement.on("click", e => {
  doSomething(e.target)
})
...
detach() //same behavior than native target.removeEventListener

const detachDelegation = myContainer.onDelegate(".js_sub-elements", "click", e => {
  doSomething(e.target)
});
// clicking on a child having the "js_sub-elements" class will trigger the event

...
detachDelegation() // remove event listener used to delegate

// EnhancedHTMLElementList

const detach = queryAll(".js_my-elements").on("click", e => {
  doSomething(e.target)
})
...
detach()

const detachDelegations = queryAll(".js_my-elements").onDelegate(
  ".js_my-sub-elements",
  "click",
  e => {
    doSomething(e.target)
  }
)
...
detachDelegations()

```

### Advanced features

#### Event configuration

When attaching an event with `.on` or `.onDelegate` you can specify an optional event configuration object as last parameter.
This configuration object has a `once` boolean property that when `true` will automatically detach the event after having called once.

```ts
myElement2.on(
  "click",
  e => {
    doSomething(e.target);
    // event listener will be detached
  },
  {
    once: true
  }
);
```

#### Specializing the HTMLElement (ex: HTMLInputElement)

Because `EnhancedHTMLElement` enhances `HTMLElement` by default, to access properties/methods from an enhanced HTMLInputElement with Typescript (ex: `myEnhancedInput.value`), you must declare the target Type when calling the query/converting method

```ts
import { query, queryAll, toEnhancedHTMLElement } from "@drivy/dom-query"
...

const myEnhancedInput = query<HTMLInputElement>(".js_my-target-input");
doSomething(myEnhancedInput.value)

const myEnhancedInput2 = toEnhancedHTMLElement<HTMLInputElement>(myExistingInput);
doSomething(myEnhancedInput2.value)

const myEnhancedInputs = queryAll<HTMLInputElement>(".js_my-target-inputs");
myEnhancedInputs.forEach(myInput => {
  doSomething(myInput.value);
})
```
