console.log("frontend js is working!");
const form = document.getElementById("myForm");
const inputGroup = document.getElementsByClassName("inputGroup");
const submitButton = form.querySelector('button[type="submit"]');
let inputCounter = 1;

function inputGroupTemplate(){
    inputCounter+=1;
    return `<div class="inputGroup">
                <input type="text" placeholder="enter the link" name="link">
                <button type="button" class="delete">x</button>
                <button type="button" class="add">+</button>
            </div>`;

}

document.addEventListener("click", (e)=>{
    if(e.target.classList.contains("delete")){
        console.log("deleting");
        if(inputCounter>1){
            e.target.parentElement.remove();
            inputCounter-=1;
        }
        else
            alert("The input can't be deleted, you can edit it");
    }

    else if(e.target.classList.contains("add")){
        console.log("adding");
        submitButton.insertAdjacentHTML("beforebegin", inputGroupTemplate());
    }
});

// form.addEventListener('submit', (e)=>{
//     e.preventDefault();
//     const links = Array.from(
//         inputGroup.querySelectorAll('input[name="link"]').map(input => input.value)
//     );
//     console.log("links:", links);
    
// });