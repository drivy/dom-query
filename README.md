# Enhanced HTML elements with query/event methods

Functions dedicated to easily select elements from the DOM (css query selectors) and handle events (attach/detach)

- explicite imports
- native-like chaining
- leverage TypeScript
- non-verbose API
- can be introduced in existing code base (conversion methods)

## Enhanced HTML Element API

### Get elements from the DOM

`query`

- to select a element from the DOM with a css query selector.
- return `null` if no element matches the selector.
- Chainable. Chained method will be based on the element context

`queryStrict`

- like `query` but will raise en exception if no element matches the selector.

`queryAll`

- to select a list of elements from the DOM with a css query selector. Unlike the native Element.querySelectorAll method, the result will be an array and so you can directly access Array methods (forEach, map, reduce, filter...)

Examples:

```ts
import { query, queryStrict, queryAll } from "utils/query"
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

You have to use those methods when input elements are out of you scope (function args, event.target ...)

```ts
import { toEnhancedHTMLElement, toEnhancedHTMLElementList } from "utils/query"
...

const myElement = toEnhancedHTMLElement(myHTMLElement);
const myElements = toEnhancedHTMLElementList(myHTMLElements);
```

### Handle events

Based on a EnhancedHTMLElement/EnhancedHTMLElementList retrieved with the previous query/transform methods, you can attach/detach events with the following methods:

EnhancedHTMLElement`.on`

- To attach event like native `target.addEventListener`.
- Returns a "detach" function. When called, will remove the event listener like `target.removeEventListener`.

EnhancedHTMLElementList`.on`

- Same parameters and behavior than EnhancedHTMLElement`.on` but the event will be attached on each element contained in the list.
- Returns a "detach" function that when called will detach the events attached on each element of the list

EnhancedHTMLElement`.onDelegate`

- To do event delegation. [pattern description here](https://davidwalsh.name/event-delegate).
- Like `.on` method but takes an extra parameter (first one) as a css query selector to specify the children to used as event targets
- Returns a "detach" function. When called, will remove the event listener attached to the container.

EnhancedHTMLElementList`.onDelegate`

- Same parameters and behavior than EnhancedHTMLElement`.onDelegate` but the event delegation will be done for each element of the list.
- Returns a "detach" function that when called will detach the events attached on each element of the list

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
import { query, queryAll, toEnhancedHTMLElement } from "utils/query"
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
