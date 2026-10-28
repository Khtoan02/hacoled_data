// PostgreSQL migration statements: semicolons inside strings, comments or
// dollar-quoted function bodies must never split a statement.
export function sqlStatements(source) {
  const statements=[];
  let start=0,quote=null,dollar=null,line=false,block=0;
  for(let i=0;i<source.length;i++){
    const c=source[i],next=source[i+1];
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='/'&&next==='*'){block++;i++;}else if(c==='*'&&next==='/'){block--;i++;}continue;}
    if(dollar){if(source.startsWith(dollar,i)){i+=dollar.length-1;dollar=null;}continue;}
    if(quote){if(c===quote){if(next===quote)i++;else quote=null;}continue;}
    if(c==='-'&&next==='-'){line=true;i++;continue;}
    if(c==='/'&&next==='*'){block=1;i++;continue;}
    if(c==="'"||c==='"'){quote=c;continue;}
    if(c==='$'){const match=source.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/);if(match){dollar=match[0];i+=dollar.length-1;continue;}}
    if(c===';'){const statement=source.slice(start,i).trim();if(statement)statements.push(statement);start=i+1;}
  }
  if(quote||dollar||block)throw new Error('Unterminated migration SQL');
  const tail=source.slice(start).trim();if(tail)statements.push(tail);
  return statements;
}
