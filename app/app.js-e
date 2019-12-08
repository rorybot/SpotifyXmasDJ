import React, { Component } from 'react';
// import './app.css';
// import ReactImage from './react.png';
var client_id =  process.env.XMAS_SPOTIFY_ID; // Your client id
var client_secret = process.env.XMAS_SPOTIFY_ID; // Your secret

export default class App extends Component {

  componentDidMount() {
    console.log(client_id);
    state = { client_id: null };
    fetch('/spotify_auth')
      .then(res => res.json())
      .then(user => this.setState({ client_id: client_id }));
  }

  render() {
    const { client_id } = this.state;
    return (
      <div>
        {client_id ? <h1>{`Hello ${client_id}`}</h1> : <h1>Loading.. please wait!</h1>}
        <img src={ReactImage} alt="react" />
      </div>
    );
  }
}
