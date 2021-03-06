import React from 'react';
import './App.css';

import Particles from 'react-particles-js';
import particlesOption from '../components/particlesOption.js'

import Clarifai from 'clarifai'

import Navigation from '../components/Navigation.js'
import Signin from '../components/Signin.js'
import Register from '../components/Register.js'
import Logo from '../components/Logo/Logo.js'
import Rank from '../components/Rank.js'
import ImageLinkForm from '../components/ImageLinkForm/ImageLinkForm.js'
import ColorRecognition from '../components/ColorRecognition/ColorRecognition.js'

const apiKey = process.env.REACT_APP_APIKey;
const host = process.env.REACT_APP_HOST;
const port = process.env.REACT_APP_PORT;

const app = new Clarifai.App({apiKey: apiKey});
const server = host + ":" + port;

class App extends React.Component {
    constructor(){
        super();
        this.state = {
            input:"",
            link:'',
            colors:[{hex:'',name:'',percent:''}],
            linkstatus:'',//'true','invalidUrl','invalidFile'

            route:'home',//'home','signin','register'
            isSignedIn:false,//true
            user:{
                id:-1,
                name:'',
                entries:0
            }
        } 
    }

    changeToInitialStatus= () => {
        this.setState({
            input:"",
            link:'',
            colors:[{hex:'',name:'',percent:''}],
            linkstatus:''
        })
    }

    onRouteChange = (route) => {
        this.setState({route:route})
    }

    onSigninStatusChange = (isSignedIn) =>{
        this.setState({isSignedIn:isSignedIn})
    }

    loadUser = (data) => {
        this.setState({
            user:{
                id:data.id,
                name:data.name,
                entries:parseInt(data.entries)
            }
        })
    }

    updateEntries = () => {
        if(this.state.isSignedIn){
            fetch(server+"/image",{
                method:'put',
                headers:{'Content-type':'application/json'},
                body:JSON.stringify({
                    id:this.state.user.id
                })
            })
            .then(response => response.json())
            .then(data => {
                if(data==='no such user' || data==='update entries failed'){
                    console.log("There is something wrong with the user info. Update entries failed.")
                }else{
                    this.setState({
                        user:{
                            ...this.state.user,
                            entries:data
                        }
                    })
                    // this.setState(Object.assign(this.state.user,{entries:data}))
                }
            })
            .catch(err => {
                console.log("Update entries failed. May be there is something wrong with database.");
                console.log(err);
            })
        }
    }
    
    abstractColorInfo = (response) => {
        const colors = response.outputs[0].data.colors.map(colorinfo =>{
            return {hex:colorinfo.raw_hex,name:colorinfo.w3c.name,percent:Number(colorinfo.value*100).toFixed(1)+"%"}
        });
        colors.sort(function(a,b){
            return b.percent.substr(0,b.percent.length-1)-a.percent.substr(0,a.percent.length-1)
        })
        return colors;
    }

    onInputChange = (event) =>{
        this.setState({input:event.target.value})
    }

    onSubmitDetect = (event) =>{
        event.target.parentNode.firstChild.value='';
        app.models
            .predict("eeed0b6733a644cea07cf4c60f87ebb7", this.state.input)
            .then(response => this.setState({colors:this.abstractColorInfo(response)}))
            .then(this.setState(
                ()=>({
                    input:'',
                    link:this.state.input,
                    linkstatus:'true',
                    })
            ))
            .then(()=>{this.updateEntries()})
            .catch(() => {
                this.setState({linkstatus:'invalidUrl'});})
    }

    onUpload = (event) => {
        const reader = new FileReader();
        reader.onload = (e) =>{
            app.models
                .predict("eeed0b6733a644cea07cf4c60f87ebb7", e.target.result.split('base64,')[1])
                .then(response => this.setState({colors:this.abstractColorInfo(response)}))
                .then(this.setState(
                    ()=>({
                        link: e.target.result,
                        linkstatus:'true',
                    })
                ))
                .then(()=>{this.updateEntries()})
                .catch(() => this.setState({linkstatus:'invalidFile'}));
        }
        const file = event.target.files[0];
        if(file){
            reader.readAsDataURL(file);
        }
    }

    render(){
        return (
            <div className="App">
                <Particles className='particles' params={particlesOption} />
                <Navigation 
                    onRouteChange={this.onRouteChange} 
                    onSigninStatusChange={this.onSigninStatusChange} 
                    isSignedIn={this.state.isSignedIn} 
                    changeToInitialStatus={this.changeToInitialStatus}
                />
                {this.state.route==='home'
                    ?<div>
                        <Logo />
                        <Rank isSignedIn={this.state.isSignedIn} name={this.state.user.name} entries={this.state.user.entries}/>
                        <ImageLinkForm onInputChange={this.onInputChange} onSubmitDetect={this.onSubmitDetect} onUpload={this.onUpload}/>
                        <ColorRecognition link={this.state.link} linkstatus={this.state.linkstatus} colors={this.state.colors}/>
                    </div>
                    :(
                        this.state.route ==="signin"
                        ?<Signin 
                            onRouteChange={this.onRouteChange} 
                            onSigninStatusChange={this.onSigninStatusChange} 
                            loadUser={this.loadUser}
                            changeToInitialStatus={this.changeToInitialStatus}
                            server={server}
                        /> 
                        :(
                            this.state.route === 'register'
                            ?<Register onRouteChange={this.onRouteChange} server={server}/> 
                            :<div></div>
                        )
                    )
                }
            </div>
        )
    }
}

export default App;
