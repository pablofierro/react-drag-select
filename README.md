# React Drag to Select Component

A React component that provides group and individual item selection using mouse drag or shift/ctrl + click to select individual items.

## Public Methods

##### selectItem(key, status)

Manually sets an items selection status by its id.

##### selectAll()

Select all elements in the list.

##### clearSelection()

Clears all selected items.

## Options

| Property Name     | Description                                                            | Type     | Default |
|-------------------|------------------------------------------------------------------------|----------|---------|
| enabled           | Enables or disables the drag select behaviour                          | boolean  | true    |
| onSelectionChange | Called when the selected items change, receives item keys as argument. | function | noop    |
