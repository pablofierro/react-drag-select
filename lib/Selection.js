'use strict';

var _ = require('lodash');
var React = require('react');
var ReactDOM = require('react-dom');

var Selection = React.createClass({
  displayName: 'Selection',


  propTypes: {
    enabled: React.PropTypes.bool,
    onSelectionChange: React.PropTypes.func
  },

  /**
   * Component default props
   */
  getDefaultProps: function getDefaultProps() {
    return {
      enabled: true,
      onSelectionChange: _.noop,
      selectedList: []
    };
  },

  /**
   * Component initial state
   */
  getInitialState: function getInitialState() {
    return {
      mouseDown: false,
      startPoint: null,
      endPoint: null,
      selectionBox: null,
      selectedItems: {},
      appendMode: false
    };
  },

  /**
   * On componentn mount
   */
  componentWillMount: function componentWillMount() {
    this.selectedChildren = {};
  },

  /**
   * On component props change
   */
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var _this2 = this;

    var nextState = {};
    if (!nextProps.enabled) {
      nextState.selectedItems = {};
    }
    this.setState(nextState);

    this.selectedChildren = {};
    nextProps.selectedList.map(function (item) {
      _this2.selectedChildren[item] = true;
    });
  },

  /**
   * On component update
   */
  componentDidUpdate: function componentDidUpdate() {
    if (this.state.mouseDown && !_.isNull(this.state.selectionBox)) {
      this._updateCollidingChildren(this.state.selectionBox);
    }
  },

  /**
   * On root element mouse down
   */
  _onMouseDown: function _onMouseDown(e) {
    if (!this.props.enabled || e.button === 2 || e.nativeEvent.which === 2) {
      return;
    }
    var nextState = {};
    if (e.ctrlKey || e.altKey || e.shiftKey) {
      nextState.appendMode = true;
    }
    nextState.mouseDown = true;

    var parentNode = ReactDOM.findDOMNode(this.refs.selectionBox);
    var scrollY = Math.abs(parentNode.getClientRects()[0].top - this.cumulativeOffset(parentNode).top);
    var scrollX = Math.abs(parentNode.getClientRects()[0].left - this.cumulativeOffset(parentNode).left);
    nextState.startPoint = {
      x: e.pageX - this.cumulativeOffset(parentNode).left + scrollX,
      y: e.pageY - this.cumulativeOffset(parentNode).top + scrollY
    };
    this.setState(nextState);
    window.document.addEventListener('mousemove', this._onMouseMove);
    window.document.addEventListener('mouseup', this._onMouseUp);
  },

  /**
   * On document element mouse up
   */
  _onMouseUp: function _onMouseUp(e) {
    window.document.removeEventListener('mousemove', this._onMouseMove);
    window.document.removeEventListener('mouseup', this._onMouseUp);
    this.setState({
      mouseDown: false,
      startPoint: null,
      endPoint: null,
      selectionBox: null,
      appendMode: false
    });
    this.props.onSelectionChange.call(null, _.keys(this.selectedChildren));
  },

  /**
   * On document element mouse move
   */
  _onMouseMove: function _onMouseMove(e) {
    e.preventDefault();
    if (this.state.mouseDown) {
      var parentNode = ReactDOM.findDOMNode(this.refs.selectionBox);
      var scrollY = Math.abs(parentNode.getClientRects()[0].top - this.cumulativeOffset(parentNode).top);
      var scrollX = Math.abs(parentNode.getClientRects()[0].left - this.cumulativeOffset(parentNode).left);
      var endPoint = {
        x: e.pageX - this.cumulativeOffset(parentNode).left + scrollX,
        y: e.pageY - this.cumulativeOffset(parentNode).top + scrollY
      };
      this.setState({
        endPoint: endPoint,
        selectionBox: this._calculateSelectionBox(this.state.startPoint, endPoint)
      });
    }
  },

  /**
   * Render
   */
  render: function render() {
    var className = 'selection ' + (this.state.mouseDown ? 'dragging' : '');
    return React.createElement(
      'div',
      { className: className, ref: 'selectionBox', onMouseDown: this._onMouseDown },
      this.renderChildren(),
      this.renderSelectionBox()
    );
  },

  /**
   * Render children
   */
  renderChildren: function renderChildren() {
    var index = 0;
    var _this = this;
    var tmpChild;
    return React.Children.map(this.props.children, function (child) {
      var tmpKey = _.isNull(child.key) ? index++ : child.key;
      var isSelected = _.has(_this.selectedChildren, tmpKey);
      tmpChild = React.cloneElement(child, {
        ref: tmpKey,
        selectionParent: _this,
        isSelected: isSelected
      });
      return React.DOM.div({
        className: 'select-box ' + (isSelected ? 'selected' : ''),
        onClickCapture: function onClickCapture(e) {
          if ((e.ctrlKey || e.altKey || e.shiftKey) && _this.props.enabled) {
            e.preventDefault();
            e.stopPropagation();
            _this.selectItem(tmpKey, !_.has(_this.selectedChildren, tmpKey));
          }
        }
      }, tmpChild);
    });
  },

  /**
   * Render selection box
   */
  renderSelectionBox: function renderSelectionBox() {
    if (!this.state.mouseDown || _.isNull(this.state.endPoint) || _.isNull(this.state.startPoint)) {
      return null;
    }
    return React.createElement('div', { className: 'selection-border', style: this.state.selectionBox });
  },

  /**
   * Manually update the selection status of an item
   * @param {string} key the item's target key value
   * @param {boolean} isSelected the item's target selection status
   */
  selectItem: function selectItem(key, isSelected) {
    if (isSelected) {
      this.selectedChildren[key] = isSelected;
    } else {
      delete this.selectedChildren[key];
    }
    this.props.onSelectionChange.call(null, _.keys(this.selectedChildren));
    this.forceUpdate();
  },

  /**
   * Select all items
   */
  selectAll: function selectAll() {
    _.each(this.refs, function (ref, key) {
      if (key !== 'selectionBox') {
        this.selectedChildren[key] = true;
      }
    }.bind(this));
  },

  /**
   * Manually clear selected items
   */
  clearSelection: function clearSelection() {
    this.selectedChildren = {};
    this.props.onSelectionChange.call(null, []);
    this.forceUpdate();
  },

  /**
   * Detect 2D box intersection
   */
  _boxIntersects: function _boxIntersects(boxA, boxB) {
    if (boxA.left <= boxB.left + boxB.width && boxA.left + boxA.width >= boxB.left && boxA.top <= boxB.top + boxB.height && boxA.top + boxA.height >= boxB.top) {
      return true;
    }
    return false;
  },

  /**
   * Updates the selected items based on the
   * collisions with selectionBox
   */
  _updateCollidingChildren: function _updateCollidingChildren(selectionBox) {
    var tmpNode = null;
    var tmpBox = null;
    var _this = this;
    _.each(this.refs, function (ref, key) {
      if (key !== 'selectionBox') {
        tmpNode = ReactDOM.findDOMNode(ref);
        tmpBox = {
          top: tmpNode.offsetTop,
          left: tmpNode.offsetLeft,
          width: tmpNode.clientWidth,
          height: tmpNode.clientHeight
        };
        if (_this._boxIntersects(selectionBox, tmpBox)) {
          _this.selectedChildren[key] = true;
        } else {
          if (!_this.state.appendMode) {
            delete _this.selectedChildren[key];
          }
        }
      }
    });
  },

  /**
   * Calculate selection box dimensions
   */
  _calculateSelectionBox: function _calculateSelectionBox(startPoint, endPoint) {
    if (!this.state.mouseDown || _.isNull(endPoint) || _.isNull(startPoint)) {
      return null;
    }
    var parentNode = ReactDOM.findDOMNode(this.refs.selectionBox);
    var left = Math.min(startPoint.x, endPoint.x) - parentNode.offsetLeft;
    var top = Math.min(startPoint.y, endPoint.y) - parentNode.offsetTop;
    var width = Math.abs(startPoint.x - endPoint.x);
    var height = Math.abs(startPoint.y - endPoint.y);
    return {
      left: left,
      top: top,
      width: width,
      height: height
    };
  },

  cumulativeOffset: function cumulativeOffset(element) {
    var top = 0,
        left = 0;
    do {
      top += element.offsetTop || 0;
      left += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);

    return {
      top: top,
      left: left
    };
  }

});

module.exports = Selection;
