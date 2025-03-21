---
mapped_pages:
  - https://www.elastic.co/guide/en/kibana/current/uiactions-plugin.html
---

# UI Actions [uiactions-plugin]

UI Actions plugins provides API to manage **triggers** and **actions**.

**Trigger** is an abstract description of user’s intent to perform an action (like user clicking on a value inside chart). It allows us to do runtime binding between code from different plugins. For, example one such trigger is when somebody applies filters on dashboard; another one is when somebody opens a Dashboard panel context menu.

**Actions** are pieces of code that execute in response to a trigger. For example, to the dashboard filtering trigger multiple actions can be attached. Once a user filters on the dashboard all possible actions are displayed to the user in a popup menu and the user has to chose one.

In general this plugin provides:

* Creating custom functionality (actions).
* Creating custom user interaction events (triggers).
* Attaching and detaching actions to triggers.
* Emitting trigger events.
* Executing actions attached to a given trigger.
* Exposing a context menu for the user to choose the appropriate action when there are multiple actions attached to a single trigger.

## Basic usage [_basic_usage]

To get started, first you need to know a trigger you will attach your actions to. You can either pick an existing one, or register your own one:

```typescript
plugins.uiActions.registerTrigger({
  id: 'MY_APP_PIE_CHART_CLICK',
  title: 'Pie chart click',
  description: 'When user clicks on a pie chart slice.',
});
```

Now, when user clicks on a pie slice you need to "trigger" your trigger and provide some context data:

```typescript
plugins.uiActions.getTrigger('MY_APP_PIE_CHART_CLICK').exec({
  /* Custom context data. */
});
```

Finally, your code or developers from other plugins can register UI actions that listen for the above trigger and execute some code when the trigger is triggered.

```typescript
plugins.uiActions.registerAction({
  id: 'DO_SOMETHING',
  isCompatible: async (context) => true,
  execute: async (context) => {
    // Do something.
  },
});
plugins.uiActions.attachAction('MY_APP_PIE_CHART_CLICK', 'DO_SOMETHING');
```

Now your `DO_SOMETHING` action will automatically execute when `MY_APP_PIE_CHART_CLICK` trigger is triggered; or, if more than one compatible action is attached to that trigger, user will be presented with a context menu popup to select one action to execute.


## Examples [_examples_9]

[ui_action examples](https://github.com/elastic/kibana/blob/main/examples/ui_action_examples/README.md)


