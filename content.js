async function print_val(val){
    console.log(val);
}

function get_count_anchor(){
    let main_post = document.getElementsByClassName("fatitem")[0];
    let subline = main_post.getElementsByClassName("subline")[0];
    let anchors = Array.from(subline.getElementsByTagName("a"));
    for( let anchor of anchors ){
        if(anchor.href){
            if(anchor.innerHTML.includes("comment")){
                return anchor;
            }
        }
    }
    return null;
}

function get_comment_count(){
    let count = 0;
    let anchor = get_count_anchor();
    if(anchor){
        count = Number(anchor.innerHTML.split("&nbsp;")[0]);
    }
    return count;
}

async function store_data(){

    let max = 0;
    let posts = document.getElementsByClassName("comtr");
    for(let post of posts){
        let age_span = post.getElementsByClassName("age")[0];
        if(age_span){
            let age_str = age_span.getAttribute("title");
            let timestamp_str = age_str.split(/[ ,]+/)[1];
            let timestamp_num = Number(timestamp_str);
            if(timestamp_num > max){
                max = timestamp_num
            }
        }
    }

    let count = get_comment_count();

    let key = "HN_timestamp_" + location.href;
    return chrome.storage.local.set({[key]: {"max":max,"count":count}});
}

async function get_HN_item(){
    let key = "HN_timestamp_" + location.href;
    return chrome.storage.local.get([key]);
}

function create_refresh_button(){
    let button_id = "highlight-refresh-btn";
    if(document.getElementById(button_id)){
        return true;
    }else{
        let button = document.createElement("button");
        button.id = button_id;
        button.textContent = "Get new comments";
        Object.assign(button.style, {
            position: "fixed",
            top: "10px",
            right: "10px",
            zIndex: 9999,
            padding: "10px 15px",
        });
        button.onclick = function(){
            store_data().then(location.reload());
        }
        return button;
    }
}

new_button = null;//create_refresh_button();
if(new_button){
    document.body.appendChild(new_button);
}

function isEmpty(obj){
    for (const prop in obj){
        if (Object.hasOwn(obj, prop)){
            return false;
        }
    }
    return true;
}

get_HN_item().then( function(old_HN_item){
    console.log(old_HN_item);
    if(!isEmpty(old_HN_item)){
        let key = "HN_timestamp_" + location.href;
        let posts = document.getElementsByClassName("comtr");
        for( let post of posts){
            let age_span = post.getElementsByClassName("age")[0];
            if(age_span){
                let age_str = age_span.getAttribute("title");
                let timestamp_str = age_str.split(/[ ,]+/)[1];
                let timestamp_num = Number(timestamp_str);
                if(timestamp_num > old_HN_item[key]["max"]){
                    let anchor = age_span.getElementsByTagName("a")[0];
                    anchor.style['color'] = '#b37400';
                    anchor.style['font-weight'] = 'bold';
                    post.style['background-color'] = '#e6e6e6';
                }
            }
        }
        let new_count = get_comment_count();
        if(new_count > old_HN_item[key]["count"]){
            let anchor = get_count_anchor();
            anchor.style['color'] = '#b37400';
            anchor.style['font-wieght'] = 'bold';
        }
    }
}).then( store_data );

/* ----
// To-do: Implement a mechanism that cleans up old items in storage.
//   - Probably do a check for time since last clean-up
//     - If it has been long enough, iterate through storage items seeking if
//     the item's associated timestamp is older than now.timestamp-4weekdiff
//       - If so then call chrome.storage.local.remove().
---- */
