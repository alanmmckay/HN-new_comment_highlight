async function print_val(val){ //used for asynchronous debugging
    console.log(val);
}

// --- Functions used for navigating and retreiving content of primary post:
function get_subline_span(){
    let main_post = document.getElementsByClassName("fatitem")[0];
    return main_post.getElementsByClassName("subline")[0];
}

function get_primary_timestamp(){
    let subline = get_subline_span();
    let age_span = subline.getElementsByClassName("age")[0];
    if(age_span){
        let age_str = age_span.getAttribute("title");
        let timestamp_str = age_str.split(/[ ,]+/)[1];
        let timestamp_num = Number(timestamp_str);
        return timestamp_num;
    }
}

function get_count_anchor(){
    let subline = get_subline_span();
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
// --- --- --- --- --- //


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
    let count = 0;
    if(max == 0){
        max = get_primary_timestamp();
    }else{
        count = get_comment_count();
    }
    let key = "HN_timestamp_" + location.href;
    return chrome.storage.local.set({[key]: {"max":max,"count":count}});
}

async function clean_data(){
    let now = Math.floor((new Date()).getTime() / 1000);
    let keys = await chrome.storage.local.getKeys();
    for( let key of keys){
        if(key.toString().substr(0,13) == "HN_timestamp_"){
            let entry = await chrome.storage.local.get([key]);
            let timestamp = entry[key]['max'];
            if( (timestamp + (4*604800)) < now ){
                console.log(key);
                console.log('here');
                chrome.storage.local.remove([key]);
            }
        }
    }
}

async function get_HN_item(){
    let key = "HN_timestamp_" + location.href;
    return chrome.storage.local.get([key]);
}

function isEmpty(obj){
    for (const prop in obj){
        if (Object.hasOwn(obj, prop)){
            return false;
        }
    }
    return true;
}

function HN_nph_main(){
    get_HN_item().then( function(old_HN_item){
        //console.log(old_HN_item);
        if(!isEmpty(old_HN_item)){
            let new_count = get_comment_count();
            let key = "HN_timestamp_" + location.href;
            if(new_count > old_HN_item[key]["count"]){

                let diff_count = (new_count - old_HN_item[key]["count"]).toString();

                let posts = document.getElementsByClassName("comtr");
                let count = 0;

                for( let post of posts){
                    let age_span = post.getElementsByClassName("age")[0];
                    if(age_span){
                        let age_str = age_span.getAttribute("title");
                        let timestamp_str = age_str.split(/[ ,]+/)[1];
                        let timestamp_num = Number(timestamp_str);
                        if(timestamp_num > old_HN_item[key]["max"]){
                            count += 1;
                            let anchor = age_span.getElementsByTagName("a")[0];
                            age_span.id = "np_"+count.toString();
                            anchor.style['color'] = '#b37400';
                            anchor.style['font-weight'] = 'bold';
                            post.style['background-color'] = '#e6e6e6';

                            if(count < diff_count){
                                let new_anchor = document.createElement("a");
                                new_anchor.href = "#np_"+(count+1).toString();
                                new_anchor.innerHTML = "next unread";
                                age_span.innerHTML = age_span.innerHTML + " | ";
                                age_span.appendChild(new_anchor);
                            }
                        }//end timestamp vs max check
                    }//end age_span exists check
                }//end post iterator

                let anchor = get_count_anchor();
                anchor.style['color'] = '#b37400';
                anchor.style['font-wieght'] = 'bold';
                let subline = get_subline_span();
                subline.innerHTML = subline.innerHTML + " <a href='#np_1'>("+diff_count+" new)</a>";
            }//end new-post-count vs old-post-count check
        }//end if HN_data exists
    }).then( store_data ).then( get_HN_item ).then( clean_data );
}

HN_nph_main();

// chrome.storage.local.set({"HN_timestamp_test": {"max":1742146925,"count":0}});

