import { Input, Tabs, Tooltip } from "antd";
import profile from "../../assets/img/profile.png";
import verified from "../../assets/img/verified.png";
import random from "../../assets/img/random.gif";
import wallpaper from "../../assets/img/wallpaper.png";
import "./style.css";
import { useEffect, useRef, useState } from "react";
import Chat from "../chat";
import Message from "../message";
import moment from "moment/moment";
import { MESSAGE_TYPE } from "../../constant";
import { getReqsApi, getUsersApi } from "../../apis";
import { BaseUrl } from "../../axios";
import logo from "../../assets/img/logo.png";
// import "../../apis/socket";
import { connectToSocketApi, socket } from "../../apis/socket";
import UserTab from "./UserTab";
import Friends from "./Friends";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../../redux/actions";
import People from "./People";
import Requests from "./Requests";

const Home = () => {
  const state = useSelector((state) => state);
  const dispatch = useDispatch();
  const typeMessage = useRef();
  const chatBody = useRef();
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("friends");

  const onChange = (e) => setMsg(e?.target?.value);

  const send = (text) => {
    text = text?.trim();
    if (text) {
      socket.emit("msg", text);
      setMessages([
        ...messages,
        { msg: text, time: new Date(), type: MESSAGE_TYPE.OUTGOING },
      ]);
      setMsg("");
      typeMessage?.current?.focus();
      chatBody.current.scrollTop = chatBody.current?.scrollHeight;
      setTimeout(() => {
        chatBody.current.scrollTop = chatBody.current?.scrollHeight + 1000;
      }, 200);
    }
  };

  const getUsers = async (params, type) => {
    try {
      let res;
      if (type === "reqs") {
        res = await getReqsApi(params);
      } else {
        res = await getUsersApi(params);
      }
      if (res?.status === 200) {
        const users = res?.data?.data?.data?.map((user) => {
          if (user?.profilePic) user.profilePic = BaseUrl + user.profilePic;
          return user;
        });
        setUsers(users);
      }
    } catch (error) {
      setUsers();
      console.log(error);
    }
  };

  const listenReceive = () => {
    socket.on("receive", (msg) => {
      setMessages([
        ...messages,
        { msg, time: new Date(), type: MESSAGE_TYPE.INCOMMING },
      ]);
      document.querySelector("#chat-body").scrollTop =
        chatBody.current?.scrollHeight;
      setTimeout(() => {
        document.querySelector("#chat-body").scrollTop =
          chatBody.current?.scrollHeight + 1000;
      }, 200);
    });
  };

  const onUserTabChange = (key) => {
    setActiveTab(key);
    if (key === "reqs") getUsers({}, "reqs");
    else if (key === "friends") getUsers({ type: "friends" });
    else getUsers();
  };

  const search = (e) => {
    if (activeTab === "reqs") getUsers({ name: e?.target?.value }, "reqs");
    else if (activeTab === "friends")
      getUsers({ name: e?.target?.value, type: "friends" });
    else getUsers({ name: e?.target?.value });
  };

  const items = [
    {
      key: "friends",
      label: <UserTab label="Friends" icon="people-outline" />,
      children: <Friends users={users} />,
    },
    {
      key: "reqs",
      label: <UserTab label="Requests" icon="person-outline" />,
      children: <Requests users={users} />,
    },
    {
      key: "people",
      label: <UserTab label="People" icon="person-add-outline" />,
      children: <People users={users} />,
    },
  ];

  useEffect(() => {
    typeMessage?.current?.focus();
    getUsers({ type: "friends" });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!socket) connectToSocketApi();
  }, []);

  useEffect(() => listenReceive());

  return (
    <div className="flex" style={{ height: "calc(max(100vh - 4rem , 36rem))" }}>
      {/* Left Part  */}
      <div className="border w-1/4">
        <div className="flex flex-col gap-3 px-5 py-3 sticky top-16 z-10 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-2xl">Chats</span>
            <span className="flex">
              <ion-icon name="ellipsis-horizontal" />
            </span>
          </div>
          <Input placeholder="Search" onChange={search} onPressEnter={search} />
          <Chat
            user={{ name: "Anonymous Users", profilePic: random }}
            annonymous={true}
            onClick={() =>
              dispatch(
                setSelectedUser({
                  name: "Anonymous Users",
                  profilePic: random,
                  userName: "random",
                  annonymous: true,
                })
              )
            }
          />
        </div>
        <Tabs
          className="flex w-full items-center"
          defaultActiveKey="1"
          onChange={onUserTabChange}
          items={items}
        />
      </div>
      {/* Right Part  */}
      <div className="border border-l-0 w-3/4 relative">
        {/* Chat Header  */}
        {state.selectedUser?.userName ? (
          <>
            <div className="flex justify-between items-center gap-3 px-5 py-2 border-b sticky top-16 z-10 bg-white">
              <Tooltip title="Info">
                <div className="flex gap-3 cursor-pointer">
                  <img
                    className="h-14 w-14 rounded-full"
                    src={state.selectedUser?.profilePic || profile}
                    alt=""
                  />
                  {state.selectedUser?.verified && (
                    <img
                      className="absolute h-5 w-5 bottom-2 left-14"
                      src={verified}
                      alt=""
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xl">{state.selectedUser?.name}</span>
                    <span className="text-gray-500 text-sm">
                      {state.selectedUser?.annonymous
                        ? "You are chatting with anonymous users"
                        : "Online"}
                    </span>
                  </div>
                </div>
              </Tooltip>
              {!state.selectedUser?.annonymous && (
                <div className="flex gap-5 text-2xl text-gray-500">
                  <Tooltip title="Video Call">
                    <span className="flex cursor-pointer">
                      <ion-icon name="videocam-outline" />
                    </span>
                  </Tooltip>
                  <Tooltip title="Call">
                    <span className="flex cursor-pointer">
                      <ion-icon name="call-outline" />
                    </span>
                  </Tooltip>
                </div>
              )}
            </div>
            {/* Chat Body  */}
            <div
              id="chat-body"
              ref={chatBody}
              className="relative px-5 py-2 overflow-auto"
            >
              <img src={wallpaper} alt="" />
              {messages?.map((message) => (
                <Message
                  key={message?.msg + message?.time}
                  type={message?.type}
                  msg={message?.msg}
                  time={moment(message?.time)?.format("hh:mm A")}
                />
              ))}
            </div>
            {/* Chat Footer  */}
            <div className="flex justify-around items-center text-2xl text-gray-500 py-5 border-t bg-white sticky bottom-0">
              <div className="cursor-pointer">
                <ion-icon name="happy-outline" />
              </div>
              <div className="rotate-45 cursor-pointer">
                <ion-icon name="attach-outline" />
              </div>
              <Input
                className="w-5/6"
                ref={typeMessage}
                id="type-message"
                placeholder="Type a message"
                value={msg}
                onChange={onChange}
                onPressEnter={() => send(msg)}
              />
              {msg ? (
                <div
                  className="cursor-pointer"
                  style={{ color: "var(--primary)" }}
                  onClick={() => send(msg)}
                >
                  <ion-icon name="paper-plane-outline" />
                </div>
              ) : (
                <div className="cursor-pointer">
                  <ion-icon name="mic-outline" />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="h-full flex flex-col justify-center items-center gap-3">
              <img className="h-32 w-32" src={logo} alt="" />
              <span className="text-3xl text-gray-600">Let's Chat</span>
              <span className="text-sm text-gray-600">
                Make friends & enjoy chat
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
