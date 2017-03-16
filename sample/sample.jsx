var React = require('react/addons');
var Selection = require('./../lib/Selection');

/**
 * Inner selection item
 */
var SelectionItem = React.createClass({

  render: function() {
    var className='item noselect';
    className += (this.props.isSelected ? ' selected' : '');
    return(
      <div className={className}>
        Item {this.props.data + 1 }
      </div>
    );
  }

});

// generate demo data
var data = [];
for(var i = 0; i < 65; i++) {
  data.push(
    <SelectionItem key={i} data={i}/>
  );
}

React.render(
  <Selection>
    {data}
  </Selection>,
  document.getElementById('example')
);
