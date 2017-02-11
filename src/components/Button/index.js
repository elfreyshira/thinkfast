import React, { Component } from 'react';
import './index.css';

class Button extends Component {

  static propTypes = {
  }



  render() {
    return (
      <button className="tf-button" {...this.props}>{this.props.children}</button>
    );
  }
}

export default Button;
