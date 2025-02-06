import { useState } from "react";

function ReportForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const information = (e) => {
        e.preventDefault();
        setSubmitted(true);
    }
    return ( 
        <div>
            
        <h1>Report Form</h1>
        <form onSubmit={information}>
            <label htmlFor="name">Name:</label>
            <input 
                type="text" 
                id="name" 
                name="name" 
                value={name}
                required 
                onChange={(e) => setName(e.target.value)} 
            />
            <label htmlFor="email">Email:</label>
            <input 
                type="email" 
                id="email" 
                name="email" 
                value={email}
                required  
                onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="message">Message:</label>
            <textarea 
            style={{width: '100%', height: '400px'}}
                id="message" 
                name="message" 
                value={message}
                required 
                onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <input type="submit" value="Submit" />
        </form>
        {submitted && (
                <div className="submitted-info" style={{color:"black"}}>
                    <h2>Submitted Information:</h2>
                    <p><strong>Name:</strong> {name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Message:</strong> {message}</p>
                </div>
            )}
        </div>
     );
}

export default ReportForm;