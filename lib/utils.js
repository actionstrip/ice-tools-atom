'use babel';

const utils = {};

/**
* fileName이 기본문제 콘텐츠에 해당하면 true, 아니면 false를 반환
* @param fileName
*/
utils.isQuizContents = function(fileName){
  const result = /jr_[a-z]{3}_\d{3}_\d{2}_test_\d{2}.html/.test(fileName);
  console.log("[ isQuizContents ] fileName: " + fileName + "result: " + result);
  return result;
}

/**
* 대상 text에서 정규식과 매칭되는 텍스트와 인덱스 목록을 반환한다.
* @param regexp 정규식
* @param text 대상 text
* @returns 예) [{matchedText: "매칭된 텍스트", index: 0}, ...]
*/
utils.matches = function(regexp, text){
  var match, matches = [];
  while ((match = regexp.exec(text)) != null) {
    matches.push({matchedText: match[0], index: match.index});
  }
  return matches;
}


export default utils;
