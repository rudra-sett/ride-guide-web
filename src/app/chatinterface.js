'use client'
import {useState} from "react";
import ReactMarkdown from 'react-markdown'

// import { Header, Footer, Button } from '@massds/mayflower-react';

export default function ChatApp() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  
  function parseValidJSONObjects(input) {
      const jsonObjects = [];
      const regex = /{[^{}]*}/g; // Adjusted regex to match complete JSON objects
      let match;

      while ((match = regex.exec(input)) !== null) {
          try {
              const jsonObject = JSON.parse(match[0]);
              jsonObjects.push(jsonObject);
          } catch (e) {
              // This catch block will handle any JSON parsing errors, which could occur
              // if the regex matches an incomplete JSON object. Incomplete objects at the end
              // will cause JSON.parse to throw an error, which we catch and ignore.
          }
      }

      return jsonObjects;
  }


  const handleSendMessage = async () => {
    try {
      // http://Ride-ALB-1625448229.us-east-1.elb.amazonaws.com:8000/chat
      // http://127.0.0.1:8000/chat
      const response = await fetch('http://Ride-ALB-1625448229.us-east-1.elb.amazonaws.com:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: chatHistory,
        }),
      });
      
      let receivedData = '';
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        setChatHistory((prevHistory) => [
              ...prevHistory,
              { user: message, chatbot: receivedData },
            ]);

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          let chunk = decoder.decode(value, {stream: true});
          console.log(chunk);
          console.log("\n")
         
          receivedData += chunk;
         
           // Update the chat history state with the new message
           setChatHistory((prevHistory) => [
              ...prevHistory.slice(0,-1),
              { user: message, chatbot: receivedData },
            ]);
          // chatHistory.slice(-1) = { user: message, chatbot: receivedData }
          
          // receivedData = ''; // Clear receivedData if you're concatenating inside the loop
        }
       
      }

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
};



  const handleClearChat = async () => {
    try {
      // await axios.post('http://localhost:8000/clear_chat');
      setChatHistory([]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col p-4">
      <div className="flex-grow w-full border border-[#DDDDDD] overflow-y-auto">
  {chatHistory.map((chat, index) => (
    <div key={index} className="">
      <ReactMarkdown className="text-black bg-[#D0DDE9] p-4">
        {"**You:** " + chat.user}
      </ReactMarkdown>
      <ReactMarkdown className="text-black bg-[#DDDDDD] p-4">
        {"**The RIDE:** " + chat.chatbot}
      </ReactMarkdown>
    </div>
  ))}
</div>

      <div className="flex items-end py-4 border-t border-gray-300 w-full">
        <textarea
          type="text"
          className="border border-gray-300 px-4 py-2 mr-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 resize-none"
          placeholder="Type your message..."
          value={message}
          onChange={handleMessageChange}
        />
        <div className="flex flex-col sm:flex-row">
          <button
            className="ma__button mb-2 sm:mb-0 sm:mr-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleSendMessage}
          >
            Send
          </button>
          <button
            className="ma__button bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={handleClearChat}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
  



};