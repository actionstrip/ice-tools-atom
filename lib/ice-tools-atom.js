'use babel';

import IceToolsAtomView from './ice-tools-atom-view';
import { CompositeDisposable } from 'atom';
import utils from './utils';
import _ from 'partial-js';
import cheerio from 'cheerio';
export default {

  iceToolsAtomView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {

    this.iceToolsAtomView = new IceToolsAtomView(state.iceToolsAtomViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.iceToolsAtomView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    require('atom-package-deps').install('ice-tools-atom');

    // this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
    //   this.subscriptions.add(textEditor.onDidSave(this.handleDidSave.bind(this)));
    // }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.iceToolsAtomView.destroy();
  },

  serialize() {
    return {
      iceToolsAtomViewState: this.iceToolsAtomView.serialize()
    };
  },

  toggle() {
    console.log('IceToolsAtom was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  },

  handleDidSave() {
    this.kitAnswerMatchingCheck(atom.workspace.getActiveTextEditor(), true)
  },

  provideLinter() {
    const self = this;
    return {
      name: 'ice-tools-atom',
      scope: 'file', // or 'project'
      lintsOnChange: false, // or true
      grammarScopes: ['text.html.basic'],
      lint(textEditor) {
        const editorPath = textEditor.getPath();
        if(!utils.isQuizContents(textEditor.getTitle())) return null;
        const checkedList = self.kitAnswerMatchingCheck(textEditor, true);
        const linterDataList = checkedList.map((item) => {
          return {
            fixOnSave: true,
            severity: 'warning',
            location: {
              file: editorPath,
              position: item.position,
            },
            excerpt: item.msg,
            description: item.detail
          }
        });
        return linterDataList
      }
    }
  },

  kitAnswerMatchingCheck(editor, showPop=null) {
    const checkedList = [];
    const text = editor.getText();
    const $ = cheerio.load(text);
    let msg = '';
    let detail = '';
    var kitMatchedList = [];
    editor.scan(/id[\s]{0,3}\=[\s]{0,3}\".+Kit\"/g, function(obj){
      kitMatchedList.push({
        matchedText: obj.match,
        range: obj.range,
        kit: /\"([^\"]*)\"/g.exec(obj.match)[1]
      })
    });

    // kit 정보가 있을 때만 체크
    if(kitMatchedList.length > 0){
      const answerDataText = $('#answer').text();
      let answerData = null
      try{
        answerData = ((t)=>t && JSON.parse(t))(answerDataText);
      }catch(e){
        msg = `정답 데이터 형식에 오류가 있습니다.`;
        detail = `[ 현재 정답 데이터 ]${answerDataText}`;
        (showPop && atom.notifications.addError(msg, {detail: detail}));

        editor.scan(/template[\s]+id[\s]*=[\s]*["']answer["']/g, function(obj){
          checkedList.push({
            position: obj.range,
            msg: msg,
            detail: detail
          })
        });

        return checkedList;
      }

      console.log("[ kitAnswerMatchingCheck ] answerData: ", answerData);

      // kit는 있는데 정답 정보가 없는 경우
      if(!answerData){
        (showPop && atom.notifications.addError("정답 데이터를 찾을 수 없습니다."));
      }else{
        _.each(kitMatchedList, (data, idx)=>{
          if(!answerData[data.kit]){
            msg = `${data.kit} 정답 데이터가 누락되었습니다.`;
            detail = `[ 현재 정답 데이터 ]${answerDataText}`;
            (showPop && atom.notifications.addError(msg, { detail: detail }));
            checkedList.push({
              position: data.range,
              msg: msg,
              detail: detail
            });
          }
        });
      }
    }
    console.log("[ kitAnswerMatchingCheck ] checkedList: ", checkedList);
    return checkedList;
  }
};
