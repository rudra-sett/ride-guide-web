'use client'
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown'
import Select from 'react-select'
import {modelOptions} from './data.js'


// import { Header, Footer, Button } from '@massds/mayflower-react';

export default function ChatApp() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [modelChoice, setModelChoice] = useState('anthropic.claude-3-sonnet-20240229-v1:0');

  const [isClearable, setIsClearable] = useState(false);
  const [isSearchable, setIsSearchable] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRtl, setIsRtl] = useState(false);

  const messageContainer = useRef(null);

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      background: '#fff',
      borderColor: '#9e9e9e',
      minHeight: '30px',
      height: '30px',
      boxShadow: state.isFocused ? null : null,
    }),

    valueContainer: (provided, state) => ({
      ...provided,
      height: '30px',
      padding: '0 6px 2em',
      marginBottom: '8px'
      // marginBottom: '8px'
    }),

    singleValue: (provided, state) => ({
      ...provided,
      marginBottom: '8px'
      // marginBottom: '8px'
    }),

    option: (provided, state) => ({
      ...provided,
      // color : "#141414",
      "&:hover": {
        backgroundColor: state.isDisabled ? "#E1CED2" : "#D0DDE9"
      },
      backgroundColor: state.isDisabled ? '#E1CED2' : 'white',
      color: state.isDisabled ? '#707070' : '#141414',

      // marginBottom: '8px'
    }),

    input: (provided, state) => ({
      ...provided,
      margin: '0px',
      marginBottom: '8px'
    }),
    indicatorSeparator: state => ({
      display: 'none',
    }),
    indicatorsContainer: (provided, state) => ({
      ...provided,
      height: '30px',
    }),
  };

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

  const onKeyDownHandler = (e) => {
    if (e.keyCode === 13) {
      handleSendMessage();
    }
  };

  useEffect(() => {
    document.addEventListener("keyup", onKeyDownHandler);
    return () => document.removeEventListener("keyup", onKeyDownHandler);
  });

  const handleSendMessage = async () => {
    try {
      setMessage('');
      if (messageContainer && messageContainer.current) {
        messageContainer.current.scrollTop = messageContainer.current.scrollHeight;
      }
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
          model: modelChoice
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
          let chunk = decoder.decode(value, { stream: true });
          // console.log(chunk);
          // console.log("\n")

          receivedData += chunk;

          // Update the chat history state with the new message
          setChatHistory((prevHistory) => [
            ...prevHistory.slice(0, -1),
            { user: message, chatbot: receivedData },
          ]);
          // chatHistory.slice(-1) = { user: message, chatbot: receivedData }
          if (messageContainer && messageContainer.current) {
            messageContainer.current.scrollTop = messageContainer.current.scrollHeight;
          }

          // receivedData = ''; // Clear receivedData if you're concatenating inside the loop
          
        }

      }

      
    } catch (error) {
      setMessage('');
      console.error('Error sending message:', error);
      alert('Sorry, something has gone horribly wrong!');
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
      <div className="flex justify-between bg-[#14558f] text-white h-min-16 p-4">
        <ReactMarkdown>{"**The RIDE Assistant**"}</ReactMarkdown>

        <Select
          className="basic-single h-full"
          // classNames={{
          //   control: (state) => state.isFocused ? 'border-red-600' : 'border-grey-300',
          //   container: (state) => 'h-full'
          // }}        
          classNamePrefix="select"
          defaultValue={modelOptions[1]}
          isDisabled={isDisabled}
          isLoading={isLoading}
          isClearable={isClearable}
          isRtl={isRtl}
          isSearchable={isSearchable}
          name="model"
          options={modelOptions}
          styles={customStyles}
          onChange={(choice) => setModelChoice(choice.value)}
        />
      </div>
      <div className="flex-grow w-full border border-[#DDDDDD] overflow-y-auto" ref={messageContainer}>
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