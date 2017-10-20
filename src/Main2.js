const LineAPI = require('./api');
const { Message, OpType, Location } = require('../curve-thrift/line_types');
let exec = require('child_process').exec;

const myBot = ['u3b015a9a7307cdecc4904fdb886d23b4'];
// -tips biar botnya gk error mulu-
// ubah authtoken + certificate di src/bot.js


function isAdminOrBot(param) {
    return myBot.includes(param);  
}
function firstToUpperCase(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1);
}

class LINE extends LineAPI {
    constructor() {
        super();
        this.receiverID = '';
        this.checkReader = [];
        this.stateStatus = {
           cancel: 0,
           kick: 0,
           lockgroup: 0,
           qr: 0,
           joinqr: 0,
        } 
    }

    getOprationType(operations) {
        for (let key in OpType) {
            if(operations.type == OpType[key]) {
                if(key !== 'NOTIFIED_UPDATE_PROFILE') {
                    console.info(`[* ${operations.type} ] ${key} `);
                }
            }
        }
    }
    
    poll(operation) {
        if(operation.type == 25 || operation.type == 26) {
            // console.log(operation);
            const txt = (operation.message.text !== '' && operation.message.text != null ) ? operation.message.text : '' ;
            let message = new Message(operation.message);
            this.receiverID = message.to = (operation.message.to === myBot[0]) ? operation.message.from_ : operation.message.to ;
            Object.assign(message,{ ct: operation.createdTime.toString() });
            this.textMessage(txt,message);
        }

        if(operation.type == 13 && this.stateStatus.cancel == 1) {
            this.cancelAll(operation.param1);
        }

        if(operation.type == 19) { //ada kick
            // op1 = group nya
            // op2 = yang 'nge' kick
            // op3 = yang 'di' kick
            if(isAdminOrBot(operation.param3)) {
                this._invite(operation.param1,[operation.param3]);
            }
            if(!isAdminOrBot(operation.param2)) {
                this._kickMember(operation.param1,[operation.param2]);
            }
        }
        
             if(operation.type == 19 && this.stateStatus.lockgroup == 1) { //ada kick
            //op1 = group nya
            //op2 = yang 'nge' kick
            //op3 = yang 'di' kick
            if(!isAdminOrBot(operation.param3)) {
                this._inviteIntoGroup(operation.param1,[operation.param3]);
            }
            if(!isAdminOrBot(operation.param2)) {
                this._kickMember(operation.param1,[operation.param2]);
            }
        }
      
        if(operation.type == 13 && this.stateStatus.lockgroup == 1) { //ada invite
            //op1 = group nya
            //op2 = yang 'nge' invite
            //op3 = yang 'di' invite
            if(!isAdminOrBot(operation.param2)) {
                this._kickMember(operation.param1,[operation.param2]);
            }
            if(!isAdminOrBot(operation.param3)) {
                this._cancel(operation.param1,[operation.param3]);
            }
        }
        
        if(operation.type == 15) { //ada leave
            //op1 = group nya
            //op2 = yang 'telah' leave
            if(isAdminOrBot(operation.param2)) {
                this._invite(operation.param1,[operation.param2]);
            }
        }
      
        if(operation.type == 15) { //ada leave
            //op1 = group nya
            //op2 = yang 'telah' leave
            if(!isAdminOrBot(operation.param2)) {
                this._inviteIntoGroup(operation.param1,[operation.param2]);
            }
        } 
            
        if(operation.type == 16 && this.stateStatus.joinqr == 1) { //ada join
            //op1 = group nya
            //op2 = yang 'telah' join
            if(!isAdminOrBot(operation.param2)) {
                 this._kickMember(operation.param1,[operation.param2]);
            }   
        }
      
        if(operation.type == 16) {
            let seq = new Message();
            seq.to = operation.param1;
            seq.text = "Terimaksih telah mengundang saya ke Groupmu 😊\n\nsilahkan ketik (Command) untuk mengetahui Fitur kami.\n\nJangan lupa Add creator kami👍"
          
            this._client.sendMessage(1,seq);
        }
      
