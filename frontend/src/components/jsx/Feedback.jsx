import React from "react";
import '../css/feedback.css'

function ContactForm() {
    const [result, setResult] = React.useState("");
  
    const onSubmit = async (event) => {
      event.preventDefault();
      setResult("Sending....");
      const formData = new FormData(event.target);
      
      formData.append("access_key", "63958f4f-9414-43e1-9d70-40cd839253dd");
  
      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
  
        const data = await response.json();
  
        if (data.success) {
          setResult("Form Submitted Successfully");
          event.target.reset();
        } else {
          console.error("Error:", data);
          setResult(data.message);
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        setResult("An error occurred. Please try again later.");
      }
    };
  
    return (
      <div className="contact-page">
        <div className="contact-container">
          <h1>Contact Me</h1>
          <form onSubmit={onSubmit} className="contact-form">
            <input
              type="text"
              className="form-input"
              placeholder="Your name"
              name="name"
              required
            />
            <input
              type="email"
              className="form-input"
              placeholder="Your email"
              name="email"
              required
            />
            <textarea
              className="form-textarea"
              placeholder="Your message"
              name="message"
              required
            ></textarea>
            <button type="submit" className="form-submit">
              Submit
            </button>
          </form>
          <p>{result}</p>
        </div>
      </div>
    );
  }
  
  export default ContactForm;