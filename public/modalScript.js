var modal = document.getElementById("myModal");
const nicknameInput = document.getElementById("nickname-input");

nicknameInput.onkeypress = e =>
{
    let keycode = (e.keyCode ? e.keyCode : e.which);
    if(keycode == '13')
    {
        modal.style.display = "none";
    }
};