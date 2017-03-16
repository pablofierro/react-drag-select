 'use strict';

var _ = require('lodash');
var React = require('react/addons');

var Selection = React.createClass({

  propTypes: {
    enabled: React.PropTypes.bool,
    onSelectionChange: React.PropTypes.func
  },

  /**
   * Component default props
   */
  getDefaultProps: function() {
    return {
      enabled: true,
      onSelectionChange: _.noop,
    };
  },

  /**
   * Component initial state
   */
  getInitialState: function() {
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
  componentWillMount: function() {
    this.selectedChildren = {};
  },

  /**
   * On component props change
   */
  componentWillReceiveProps: function(nextProps) {
    var nextState = {};
    if(!nextProps.enabled) {
      nextState.selectedItems = {};
    }
    this.setState(nextState);
  },

  /**
   * On component update
   */
  componentDidUpdate: function() {
    if(this.state.mouseDown && !_.isNull(this.state.selectionBox)) {
      this._updateCollidingChildren(this.state.selectionBox);
    }
  },

  /**
   * On root element mouse down
   */
  _onMouseDown: function(e) {
    if(!this.props.enabled || e.button === 2 || e.nativeEvent.which === 2) {
      return;
    }
    var nextState = {};
    if(e.ctrlKey || e.altKey || e.shiftKey) {
      nextState.appendMode = true;
    }
    nextState.mouseDown = true;
    nextState.startPoint = {
      x: e.pageX,
      y: e.pageY
    };
    this.setState(nextState);
    window.document.addEventListener('mousemove', this._onMouseMove);
    window.document.addEventListener('mouseup', this._onMouseUp);
  },

  /**
   * On document element mouse up
   */
  _onMouseUp: function(e) {
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
  _onMouseMove: function(e) {
    e.preventDefault();
    if(this.state.mouseDown) {
      var endPoint = {
        x: e.pageX,
        y: e.pageY
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
  render: function() {
    var className = 'selection ' + (this.state.mouseDown ? 'dragging' : '');
    return(
      <div className={className} ref='selectionBox' onMouseDown={this._onMouseDown}>
        {this.renderChildren()}
        {this.renderSelectionBox()}
      </div>
    );
  },

  /**
   * Render children
   */
  renderChildren: function() {
    var index = 0;
    var _this = this;
    var tmpChild;
    return React.Children.map(this.props.children, function(child) {
      var tmpKey = _.isNull(child.key) ? index++ : child.key;
      var isSelected = _.has(_this.selectedChildren, tmpKey);
      tmpChild = React.cloneElement(child, {
        ref: tmpKey,
        selectionParent: _this,
        isSelected: isSelected
      });
      return React.DOM.div({
        className: 'select-box ' + (isSelected ? 'selected' : ''),
        onClickCapture: function(e) {
          if((e.ctrlKey || e.altKey || e.shiftKey) && _this.props.enabled) {
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
  renderSelectionBox: function() {
    if(!this.state.mouseDown || _.isNull(this.state.endPoint) || _.isNull(this.state.startPoint)) {
      return null;
    }
    return(
      <div className='selection-border' style={this.state.selectionBox}></div>
    );
  },

  /**
   * Manually update the selection status of an item
   * @param {string} key the item's target key value
   * @param {boolean} isSelected the item's target selection status
   */
  selectItem: function(key, isSelected) {
    if(isSelected) {
      this.selectedChildren[key] = isSelected;
    }
    else {
      delete this.selectedChildren[key];
    }
    this.props.onSelectionChange.call(null, _.keys(this.selectedChildren));
    this.forceUpdate();
  },

  /**
   * Select all items
   */
  selectAll: function() {
    _.each(this.refs, function(ref, key) {
      if(key !== 'selectionBox') {
        this.selectedChildren[key] = true;
      }
    }.bind(this));
    this.props.onSelectionChange.call(null, _.keys(this.selectedChildren));
    this.forceUpdate();
  },

  /**
   * Manually clear selected items
   */
  clearSelection: function() {
    this.selectedChildren = {};
    this.props.onSelectionChange.call(null, []);
    this.forceUpdate();
  },

  /**
   * Detect 2D box intersection
   */
  _boxIntersects: function(boxA, boxB) {
    if(boxA.left <= boxB.left + boxB.width &&
      boxA.left + boxA.width >= boxB.left &&
      boxA.top <= boxB.top + boxB.height &&
      boxA.top + boxA.height >= boxB.top) {
      return true;
    }
    return false;
  },

  /**
   * Updates the selected items based on the
   * collisions with selectionBox
   */
  _updateCollidingChildren: function(selectionBox) {
    var tmpNode = null;
    var tmpBox = null;
    var _this = this;
    _.each(this.refs, function(ref, key) {
      if(key !== 'selectionBox') {
        tmpNode = React.findDOMNode(ref);
        tmpBox = {
          top: tmpNode.offsetTop,
          left: tmpNode.offsetLeft,
          width: tmpNode.clientWidth,
          height: tmpNode.clientHeight
        };
        if(_this._boxIntersects(selectionBox, tmpBox)) {
          _this.selectedChildren[key] = true;
        }
        else {
          if(!_this.state.appendMode) {
            delete _this.selectedChildren[key];
          }
        }
      }
    });
  },

  /**
   * Calculate selection box dimensions
   */
  _calculateSelectionBox: function(startPoint, endPoint) {
    if(!this.state.mouseDown || _.isNull(endPoint) || _.isNull(startPoint)) {
      return null;
    }
    var parentNode = this.refs.selectionBox.getDOMNode();
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
  }

});

module.exports = Selection;
