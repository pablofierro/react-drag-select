var React = require('react');
var ReactDOM = require('react-dom');
var Selection = require('./../src/Selection');

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

class Sample extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      selectedList: []
    }
  }

  render() {
    return (
      <Selection selectedList={this.state.selectedList} onSelectionChange={(list)=> this.setState({selectedList: list})}>
        {data}
      </Selection>
    )
  }
}

ReactDOM.render(
  <Sample />,
  document.getElementById('example')
);
