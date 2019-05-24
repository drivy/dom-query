import {
  query,
  queryStrict,
  queryAll,
  toEnhancedHTMLElement,
  toEnhancedHTMLElementList
} from "./";

describe("query utilities", () => {
  const domTest = `
    <div id="el1" class="class1">
        <span id="el2" class="class2"></span>
        <span id="el3" class="class2"></span>
        <span id="el4" class="class2"></span>
        <div id="el5" class="class3">
          <div id="el6" class="class4"></div>
          <div id="el7" class="class4"></div>
          <div id="el8" class="class4"></div>
        </div>
        <div id="el9" class="class3">
          <div id="el10" class="class4"></div>
          <div class="class4"></div>
          <div class="class4"></div>
        </div>
        <input id="input" type="text" value="123" />
        <input type="text" value="456" />
        <input type="text" value="789" />
    </div>
    `;

  beforeEach(() => {
    document.body.innerHTML = domTest;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("enhances existing Node", () => {
    it("enhances body", () => {
      const enhancedNode = toEnhancedHTMLElement(document.body);
      expect(enhancedNode).not.toBeNull();
      expect(enhancedNode!.isEnhancedHTMLElement).toBeTruthy();
    });

    it("enhances HTMLElement", () => {
      const idToSelect = "el1";
      const nativeQueryResult = document.querySelector<HTMLElement>(
        `#${idToSelect}`
      );
      const enhancedNode = toEnhancedHTMLElement(nativeQueryResult!);
      expect(enhancedNode).not.toBeNull();
      expect(enhancedNode!.id).toEqual(`${idToSelect}`);
      expect(enhancedNode!.isEnhancedHTMLElement).toBeTruthy();
    });

    it("enhances HTMLInputElement", () => {
      const idToSelect = "input";
      const nativeQueryResult = document.querySelector<HTMLInputElement>(
        `#${idToSelect}`
      );
      const enhancedNode = toEnhancedHTMLElement<HTMLInputElement>(
        nativeQueryResult!
      );

      expect(enhancedNode).not.toBeNull();
      expect(enhancedNode!.id).toEqual(`${idToSelect}`);
      expect(enhancedNode!.value).not.toBeUndefined();
      expect(enhancedNode!.value).toEqual(
        document.querySelector<HTMLInputElement>("#input")!.value
      );
      expect(enhancedNode!.isEnhancedHTMLElement).toBeTruthy();
    });
  });

  describe(".query", () => {
    it("return null", () => {
      const queryResult = query("#el0");
      expect(queryResult).toBeNull();
    });
    it("return correct enhancedHtmlElement", () => {
      const queryResult = query("#el1");
      expect(queryResult).not.toBeNull();
      expect(queryResult!.id).toEqual("el1");
      expect(queryResult!.isEnhancedHTMLElement).toBeTruthy();
    });

    it("return input element with available value", () => {
      const queryResult = query<HTMLInputElement>("#input");
      expect(queryResult).not.toBeNull();
      expect(queryResult!.value).not.toBeUndefined();
      expect(queryResult!.value).toEqual(
        document.querySelector<HTMLInputElement>("#input")!.value
      );
    });
  });

  describe(".query from a toEnhancedElement result", () => {
    it("return correct enhancedHtmlElement", () => {
      const nativeQueryResult = document.querySelector<HTMLElement>("#el1");
      expect(nativeQueryResult).not.toBeNull();
      if (nativeQueryResult) {
        const queryResult = toEnhancedHTMLElement(nativeQueryResult)!.query(
          "#el2"
        );
        expect(queryResult).not.toBeNull();
        expect(queryResult!.id).toEqual("el2");
        expect(queryResult!.isEnhancedHTMLElement).toBeTruthy();
      }
    });
  });

  describe("chaining .query", () => {
    it("apply context to return enhancedHtmlElement", () => {
      const queryResult = query("#el9")!.query(".class4");
      expect(queryResult).not.toBeNull();
      expect(queryResult!.id).toEqual("el10");
      expect(queryResult!.isEnhancedHTMLElement).toBeTruthy();
    });
  });

  describe(".query .on", () => {
    it("should call the callback on click", () => {
      const queryResult = query("#el2");

      expect(queryResult).not.toBeNull();

      if (queryResult) {
        const mockCallback = jest.fn();
        queryResult.on("click", mockCallback);
        queryResult.click();
        expect(mockCallback).toHaveBeenCalled();
      }
    });

    describe("should have the right even type", () => {
      it("for keyboard event", done => {
        const queryResult = query("#input");

        expect(queryResult).not.toBeNull();

        if (!queryResult) {
          done();
          return;
        }

        queryResult.on("keypress", e => {
          // make sure this does not raise any TS error
          expect(e.key).not.toBeNull();
          expect(e.key).toEqual("a");
          done();
        });
        const event = new KeyboardEvent("keypress", { key: "a" });
        queryResult.dispatchEvent(event);
      });

      it("for mouse event", done => {
        const queryResult = query("#input");

        expect(queryResult).not.toBeNull();

        if (!queryResult) {
          done();
          return;
        }

        queryResult.on("click", e => {
          // make sure this does not raise any TS error
          expect(e.clientX).not.toBeNull();
          done();
        });
        queryResult.click();
      });
    });

    it("should apply once configuration", () => {
      const queryResult = query("#el3");

      expect(queryResult).not.toBeNull();

      if (queryResult) {
        const mockCallback = jest.fn();
        const configuration = { once: true };
        queryResult.on("click", mockCallback, configuration);
        queryResult.click();
        queryResult.click();
        expect(mockCallback).toHaveBeenCalledTimes(1);
      }
    });

    it("should remove listener", () => {
      const queryResult = query("#el4");

      expect(queryResult).not.toBeNull();

      if (queryResult) {
        const mockCallback = jest.fn();
        const removeListener = queryResult.on("click", mockCallback);
        queryResult.click();

        removeListener();

        queryResult.click();
        expect(mockCallback).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe(".query .onDelegate", () => {
    it("should call the callbacks on clicks with the correct child target", () => {
      const container = query("#el1");

      const child1Id = "el2";
      const child3Id = "el4";

      const child1 = query(`#${child1Id}`);
      const child3 = query(`#${child3Id}`);

      expect(container).not.toBeNull();
      expect(child1).not.toBeNull();
      expect(child3).not.toBeNull();

      if (container && child1 && child3) {
        const mockCallback = jest.fn();
        container.onDelegate("span", "click", mockCallback);
        child1.click();
        child3.click();
        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(mockCallback.mock.calls[0][0].target.id).toBe(child1Id);
        expect(mockCallback.mock.calls[1][0].target.id).toBe(child3Id);
      }
    });

    describe("should have the right even type", () => {
      it("for keyboard event", done => {
        const container = query("#el1");

        expect(container).not.toBeNull();

        if (!container) {
          done();
          return;
        }

        container.onDelegate("input", "keypress", e => {
          // make sure this does not raise any TS error
          expect(e.key).not.toBeNull();
          expect(e.key).toEqual("a");
          done();
        });

        const event = new KeyboardEvent("keypress", {
          key: "a",
          bubbles: true
        });
        container.queryStrict("#input").dispatchEvent(event);
      });

      it("for mouse event", done => {
        const container = query("#el1");

        expect(container).not.toBeNull();

        if (!container) {
          done();
          return;
        }

        container.onDelegate("input", "click", e => {
          // make sure this does not raise any TS error
          expect(e.clientX).not.toBeNull();
          done();
        });

        container.queryStrict("#input").click();
      });
    });

    it("should apply once configuration", () => {
      const container = query("#el1");

      const child1Id = "el2";
      const child3Id = "el4";

      const child1 = query(`#${child1Id}`);
      const child3 = query(`#${child3Id}`);

      expect(container).not.toBeNull();
      expect(child1).not.toBeNull();
      expect(child3).not.toBeNull();

      if (container && child1 && child3) {
        const mockCallback = jest.fn();
        const configuration = { once: true };
        container.onDelegate("span", "click", mockCallback, configuration);
        child1.click();
        child3.click();
        expect(mockCallback).toHaveBeenCalledTimes(1);
      }
    });

    it("should remove listener", () => {
      const container = query("#el1");

      const child1Id = "el2";
      const child3Id = "el4";

      const child1 = query(`#${child1Id}`);
      const child3 = query(`#${child3Id}`);

      expect(container).not.toBeNull();
      expect(child1).not.toBeNull();
      expect(child3).not.toBeNull();

      if (container && child1 && child3) {
        const mockCallback = jest.fn();
        const removeListener = container.onDelegate(
          "span",
          "click",
          mockCallback
        );
        child1.click();
        removeListener();
        child3.click();
        expect(mockCallback).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe(".queryStrict exception", () => {
    it("throw Exception on no match", () => {
      expect(() => {
        queryStrict("#not-existing");
      }).toThrow();
    });

    it("throw Exception on chained no match", () => {
      const firstSelection = queryStrict("#el1");
      expect(firstSelection).not.toBeNull();
      expect(() => {
        firstSelection.queryStrict("#not-existing");
      }).toThrow();
    });
  });

  describe("enhances existing Node list", () => {
    it("enhances Elements", () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>(".class2")
      );

      const enhancedNodeList = toEnhancedHTMLElementList(nodes);
      expect(enhancedNodeList).not.toHaveLength(0);
      expect(enhancedNodeList.isEnhancedHTMLElementList).toBeTruthy();
      enhancedNodeList.forEach(element => {
        expect(element.isEnhancedHTMLElement).toBeTruthy();
      });
    });
  });

  describe(".queryAll", () => {
    it("return empty list", () => {
      const list = queryAll(".class0");
      expect(list).toHaveLength(0);
    });
    it("return correct enhancedHtmlElement list from document context", () => {
      const classToSelect = "class2";
      const list = queryAll(`.${classToSelect}`);
      expect(list).not.toBeNull();
      expect(list).toHaveLength(
        document.querySelectorAll(`.${classToSelect}`).length
      );
      list.forEach(element => {
        expect(element.className).toEqual(classToSelect);
      });
    });

    it("return correct enhancedHtmlElement list from Node context", () => {
      const contextNode = query("#el5");

      expect(contextNode).not.toBeNull();
      if (contextNode) {
        const classToSelect = "class4";
        const list = contextNode.queryAll(`.${classToSelect}`);
        expect(list).not.toBeNull();
        expect(list).toHaveLength(
          contextNode.querySelectorAll(`.${classToSelect}`).length
        );
        list.forEach(element => {
          expect(element.className).toEqual(classToSelect);
        });
      }
    });

    it("return correct enhanced input list from document context", () => {
      const selector = "input";
      const list = queryAll<HTMLInputElement>(selector);
      expect(list).not.toBeNull();
      expect(list).toHaveLength(document.querySelectorAll(selector).length);
      list.forEach(element => {
        expect(element.tagName).toEqual(selector.toUpperCase());
        expect(element.value).not.toBeUndefined();
      });
    });
  });

  describe(".queryAll .on", () => {
    it("should call the callback on each element click", () => {
      const classToSelect = "class2";
      const list = queryAll(`.${classToSelect}`);
      expect(list).not.toBeNull();

      if (list) {
        const mockCallback = jest.fn();
        list.on("click", mockCallback);
        list.forEach(element => {
          element.click();
        });

        expect(mockCallback).toHaveBeenCalledTimes(list.length);
      }
    });

    it("should apply once configuration on each element click", () => {
      const classToSelect = "class2";
      const list = queryAll(`.${classToSelect}`);
      expect(list).not.toBeNull();

      if (list) {
        const mockCallback = jest.fn();
        const configuration = { once: true };
        list.on("click", mockCallback, configuration);
        list.forEach(element => {
          element.click();
          element.click();
        });

        expect(mockCallback).toHaveBeenCalledTimes(list.length);
      }
    });

    it("should remove listener on each element click", () => {
      const classToSelect = "class2";
      const list = queryAll(`.${classToSelect}`);
      expect(list).not.toBeNull();

      if (list) {
        const mockCallback = jest.fn();
        const removeListener = list.on("click", mockCallback);
        list.forEach(element => {
          element.click();
        });
        removeListener();
        list.forEach(element => {
          element.click();
        });

        expect(mockCallback).toHaveBeenCalledTimes(list.length);
      }
    });
  });

  describe(".queryAll .onDelegate", () => {
    it("should call the callbacks on children clicks", () => {
      const classToSelect = "class3";
      const list = queryAll(`.${classToSelect}`);
      expect(list).not.toBeNull();

      if (list) {
        const mockCallback = jest.fn();
        const childrenClassToSelect = "class4";
        list.onDelegate(`.${childrenClassToSelect}`, "click", mockCallback);
        list.forEach(container => {
          Array.from(
            container.querySelectorAll<HTMLElement>(`.${childrenClassToSelect}`)
          ).forEach(child => {
            child.click();
          });
        });
        expect(mockCallback).toHaveBeenCalledTimes(
          document.querySelectorAll(`.${childrenClassToSelect}`).length
        );
      }
    });

    it("should apply the once configuration for container listeners on children click", () => {
      const classToSelect = "class3";
      const list = queryAll(`.${classToSelect}`);
      expect(list).not.toBeNull();

      if (list) {
        const mockCallback = jest.fn();
        const childrenClassToSelect = "class4";
        const configuration = { once: true };

        list.onDelegate(
          `.${childrenClassToSelect}`,
          "click",
          mockCallback,
          configuration
        );
        list.forEach(container => {
          Array.from(
            container.querySelectorAll<HTMLElement>(`.${childrenClassToSelect}`)
          ).forEach(child => {
            child.click();
            child.click();
          });
        });
        expect(mockCallback).toHaveBeenCalledTimes(list.length);
      }
    });

    it("should remove the container listeners", () => {
      const classToSelect = "class3";
      const list = queryAll(`.${classToSelect}`);
      expect(list).not.toBeNull();

      if (list) {
        const mockCallback = jest.fn();
        const childrenClassToSelect = "class4";

        const removeListeners = list.onDelegate(
          `.${childrenClassToSelect}`,
          "click",
          mockCallback
        );
        list.forEach(container => {
          Array.from(
            container.querySelectorAll<HTMLElement>(`.${childrenClassToSelect}`)
          ).forEach(child => {
            child.click();
          });
        });

        removeListeners();

        list.forEach(container => {
          Array.from(
            container.querySelectorAll<HTMLElement>(`.${childrenClassToSelect}`)
          ).forEach(child => {
            child.click();
          });
        });

        expect(mockCallback).toHaveBeenCalledTimes(
          document.querySelectorAll(`.${childrenClassToSelect}`).length
        );
      }
    });
  });
});
