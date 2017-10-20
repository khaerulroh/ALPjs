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
        
              
        if(operation.type == 17) {     
            let seq = new Message();
            seq.to = operation.param1;
            seq.text = `selamat datang ,semoga betah yah :)`
            
            this._client.sendMessage(1,seq);
        }
      		
        if(operation.type == 11 && this.stateStatus.qr == 1 && !isAdminOrBot(operation.param2)){//update group (open qr)
		        let seq = new Message();
			      seq.to = operation.param1;
			      this.textMessage("bukaqr",seq,operation.param2,1);
	}else if(operation.type == 11 && this.stateStatus.qr == 1 && !isAdminOrBot(operation.param2)){
		      	let seq = new Message();
			      seq.to = operation.param1;
	          this.textMessage("tutupqr",seq,operation.param2,1);
	}else if(operation.type == 11 && this.stateStatus.qr == 0 && !isAdminOrBot(operation.param2)){
		      	let seq = new Message();
		      	seq.to = operation.param1;
	          this.textMessage("bukaqr",seq,operation.param2,1);
		    }
            
        if(operation.type == 11 && this.stateStatus.qr == 1) { //ada url
            // op1 = group nya
            // op2 = yang 'open' url
            if(!isAdminOrBot(operation.param2)) {
                this._kickMember(operation.param1,[operation.param2]);     
            }
        }

        if(operation.type == 55){ //ada reader

            const idx = this.checkReader.findIndex((v) => {
                if(v.group == operation.param1) {
                    return v
                }
            })
            if(this.checkReader.length < 1 || idx == -1) {
                this.checkReader.push({ group: operation.param1, users: [operation.param2], timeSeen: [operation.param3] });
            } else {
                for (var i = 0; i < this.checkReader.length; i++) {
                    if(this.checkReader[i].group == operation.param1) {
                        if(!this.checkReader[i].users.includes(operation.param2)) {
                            this.checkReader[i].users.push(operation.param2);
                            this.checkReader[i].timeSeen.push(operation.param3);
                        }
                    }
                }
            }
        }

        if(operation.type == 13) { // diinvite
            if(isAdminOrBot(operation.param2)) {
                return this._acceptGroupInvitation(operation.param1);
            } else {
                return this._cancel(operation.param1,myBot);
            }
        }
        this.getOprationType(operation);
    }

    async cancelAll(gid) {
        let { listPendingInvite } = await this.searchGroup(gid);
        if(listPendingInvite.length > 0){
            this._cancel(gid,listPendingInvite);
        }
    }
   
    async searchGroup(gid) {
        let listPendingInvite = [];
        let thisgroup = await this._getGroups([gid]);
        if(thisgroup[0].invitee !== null) {
            listPendingInvite = thisgroup[0].invitee.map((key) => {
                return key.mid;
            });
        }
        let listMember = thisgroup[0].members.map((key) => {
            return { mid: key.mid, dn: key.displayName };
        });

        return { 
            listMember,
            listPendingInvite
        }
    }
  
    setState(seq,param) {
      if(param == 1){
      let isinya = "🚨Status🚨\n\n";
      for (var k in this.stateStatus){
          if (typeof this.stateStatus[k] !== 'function') {
          if(this.stateStatus[k]==1){
            isinya += " "+firstToUpperCase(k)+" => on\n";
          }else{
            isinya += " "+firstToUpperCase(k)+" => off\n";
          }
                }
            }this._sendMessage(seq,isinya);
    }else{
        if(isAdminOrBot(seq.from)){
            let [ actions , status ] = seq.text.split(' ');
            const action = actions.toLowerCase();
            const state = status.toLowerCase() == 'on' ? 1 : 0;
            this.stateStatus[action] = state;
        let isinya = "🚨Status🚨\n\n";
        for (var k in this.stateStatus){
            if (typeof this.stateStatus[k] !== 'function') {
            if(this.stateStatus[k]==1){
              isinya += " "+firstToUpperCase(k)+" ▶ ON\n";
            }else{
              isinya += " "+firstToUpperCase(k)+" ▶ OFF\n";
            }
                }
            }
            //this._sendMessage(seq,`Status: \n${JSON.stringify(this.stateStatus)}`);
            this._sendMessage(seq,isinya);
        } else {
            this._sendMessage(seq,`Kamu bukan admin !!`);
        }}
    }
    //setState(seq) {
        //if(isAdminOrBot(seq.from)){
            //let [ actions , status ] = seq.text.split(' ');
            //const action = actions.toLowerCase();
            //const state = status.toLowerCase() == 'on' ? 1 : 0;
            //this.stateStatus[action] = state;
            //this._sendMessage(seq,`Status: \n${JSON.stringify(this.stateStatus)}`);
        //} else {
            //this._sendMessage(seq,`Kamu bukan Boss saya😂😂`);
        //}
    
    mention(listMember) {
        let mentionStrings = [''];
        let mid = [''];
        for (var i = 0; i < listMember.length; i++) {
            mentionStrings.push('@'+listMember[i].displayName+'\n');
            mid.push(listMember[i].mid);
        }
        let strings = mentionStrings.join('');
        let member = strings.split('@').slice(1);
        
        let tmp = 0;
        let memberStart = [];
        let mentionMember = member.map((v,k) => {
            let z = tmp += v.length + 1;
            let end = z - 1;
            memberStart.push(end);
            let mentionz = `{"S":"${(isNaN(memberStart[k - 1] + 1) ? 0 : memberStart[k - 1] + 1 ) }","E":"${end}","M":"${mid[k + 1]}"}`;
            return mentionz;
        })
        return {
            names: mentionStrings.slice(1),
            cmddata: { MENTION: `{"MENTIONEES":[${mentionMember}]}` }
        }
    }

    async leftGroupByName(payload) {
        let gid = await this._findGroupByName(payload);
        for (var i = 0; i < gid.length; i++) {
            this._leaveGroup(gid[i]);
        }
    }
    
    async check(cs,group) {
        let users;
        for (var i = 0; i < cs.length; i++) {
            if(cs[i].group == group) {
                users = cs[i].users;
            }
        }
        
        let contactMember = await this._getContacts(users);
        return contactMember.map((z) => {
                return { displayName: z.displayName, mid: z.mid };
            });
    }

    removeReaderByGroup(groupID) {
        const groupIndex = this.checkReader.findIndex(v => {
            if(v.group == groupID) {
                return v
            }
        })
        
        if(groupIndex != -1) {
            this.checkReader.splice(groupIndex,1);
        }
    }

    async textMessage(textMessages, seq) {
        let [ cmd, ...payload ] = textMessages.split(' ');
        payload = payload.join(' ');
        let txt = textMessages.toLowerCase();
        let messageID = seq.id;
        var group = await this._getGroup(seq.to);
        
        if(txt == 'gcreator') {
            let creator = group.creator.mid;
            seq.contentType = 13;
            seq.contentMetadata = { mid:`${creator}`};
            this._client.sendMessage(1, seq);
        }
        
        if(txt == 'ginfo') {
            let name = group.name;
            let id = group.id;
            let creator = group.creator.displayName;
            let members = group.members.length;
            this._sendMessage(seq,`▶Nama Group :\n    ${name}\n\n▶ID Group :\n${id}\n\n▶Creator Group :\n    ${creator}\n\n▶Jumlah Member :\n    ${members}`);
         }        
      
         if(cmd == 'cancel') {
            if(payload == 'group') {
                let groupid = await this._getGroupsInvited();
                for (let i = 0; i < groupid.length; i++) {
                    this._rejectGroupInvitation(groupid[i]);                    
                }
             }      
        }
              
        if(txt == 'bukaqr' ) {
			  let ax = await this._client.getGroup(seq.to);
			  if(ax.preventJoinByTicket === true){}
           else{ax.preventJoinByTicket = true;
           await this._client.updateGroup(0, ax);}
		    }
		    if(txt == 'tutupqr' ) {
			  let ax = await this._client.getGroup(seq.to);
	  		if(ax.preventJoinByTicket === true){
           ax.preventJoinByTicket = false;
           await this._client.updateGroup(0, ax);}else{}
		
        }
        
        
