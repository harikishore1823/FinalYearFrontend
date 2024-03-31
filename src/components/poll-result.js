import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faQrcode,
  faPollH,
  faChartPie,
  faHeart,
} from '@fortawesome/free-solid-svg-icons';
import { ErrorOutline } from '@material-ui/icons/';
import QRCode from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import randomColor from 'randomcolor';
import Notification from './notification';
import PollDeleted from './user-settings/no-polls/polldeleted';
import Loader from './loader/loader';
import SocialShare from './social-share';
import Report from './reportPoll';
import UserIcon from './user-icon';
import Header from './header';
import { Switch } from 'antd';
import '../../node_modules/antd/dist/antd.css';
import Chart from 'react-apexcharts';
import { connect } from 'react-redux';
import { LogoutAction } from '../store/actions/LogoutAction';
import io from 'socket.io-client';
let socket;

function PollResult(props) {
  const ENDPOINT = 'http://localhost:5000';
  const history = useHistory();
  const [toggle, setToggle] = useState(false);
  const [voted, setVoted] = useState(false);
  const [index, setIndex] = useState(2);
  const [username, setUsername] = useState(
    props.userDetails ? props.userDetails.username : null
  );
  const [loader, setLoader] = useState(true);
  const [report, setReport] = useState(false);
  const [chart, setChart] = useState({
    options: {
      chart: {
        width: '100%',
        type: 'pie',
      },
      legend: { position: 'bottom' },
      labels: [],
      responsive: [
        {
          breakpoint: '900',
          chart: { width: '100%' },
          options: { legend: { position: 'bottom' } },
        },
      ],
      plotOptions: {
        pie: {
          dataLabels: {
            offset: -5,
          },
        },
      },
    },
    series: [],
    labels: [],
  });
  const [owner, setOwner] = useState('');
  const [pollid, setPollid] = useState('');
  const [expired, setExpired] = useState({ expired: false, expiration: '' });
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [showQR, setShowQR] = useState(false);

  var cache = JSON.parse(
    localStorage.getItem(
      question.toLowerCase().trim().slice(0, 4) + pollid.slice(0, 6)
    )
  );

  let totalvotes = 0;
  options.map((x) => {
    return (totalvotes += x.count);
  });
  let mostvoted = Math.max.apply(
    Math,
    options.map((x) => {
      return x.count;
    })
  );

  const [toast, setToast] = useState({
    snackbaropen: false,
    msg: '',
    not: '',
  });
  const snackbarclose = (event) => {
    setToast({
      snackbaropen: false,
    });
  };

  var temp = JSON.parse(localStorage.getItem('notify'));
  useEffect(() => {
    if (temp) {
      setToast({ snackbaropen: true, msg: temp.msg, not: temp.type });
      localStorage.removeItem('notify');
    }
  }, [temp]);

  useEffect(() => {
    let series = [],
      labels = [];
    options.map((option) => {
      series.push(option.count);
      labels.push(option.options);
      return { series, labels };
    });
    setChart({
      options: { ...options, labels: labels },
      series: series,
      labels: labels,
    });
  }, [options]);

  useEffect(() => {
    socket = io(ENDPOINT);
    var x = props.match.params.id;
    const id = x;
    setPollid(id);
    socket.emit('getPoll', { id: id, username: username });
    socket.on('receivePoll', (poll) => {
      if (poll) {
        let medium = [];
        const numbersToAddZeroTo = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        setQuestion(poll.question);
        setOwner(poll.username);
        setVoted(poll.voted);
        setIndex(poll.index);
        var retrieve = new Date(poll.expiration);
        const date =
          retrieve.getDate() +
          '/' +
          (retrieve.getMonth() + 1) +
          '/' +
          retrieve.getFullYear();
        const time =
          retrieve.getHours() +
          ':' +
          (numbersToAddZeroTo.includes(retrieve.getMinutes())
            ? `0${retrieve.getMinutes()}`
            : retrieve.getMinutes());
        setExpired({
          expired: poll.expired,
          expiration: date + ' ' + time,
        });
        poll.options.map((option) => {
          option.color = randomColor();
          medium.push(option);
          return medium;
        });
        setOptions(medium);
        setLoader(false);
      } else {
        setLoader(false);
      }
    });
  }, [ENDPOINT, props]);

  const QR = () => (
    <div
      className="w-100 justify-content-center d-flex align-items-center position-fixed fixed-top"
      onClick={() => {
        setShowQR(false);
      }}
      style={{
        height: '100%',
        zIndex: 1,
        backgroundColor: 'rgba(135,206,235 ,0.7)',
      }}
    >
      <div className="d-flex flex-column align-items-center bg-white">
        <span className="font-weight-bold ">Scan QR Code</span>
        <QRCode
          value={`http://localhost:5000/poll/${pollid}`}
          size={290}
          level={'H'}
          includeMargin={true}
        />
      </div>
    </div>
  );
  const ShowButton = () => (
    <button
      className={
        'text-decoration-none h5 font-weight-bold mb-5 px-2 py-3 rounded-lg text-center text-white border-0' +
        (expired.expired ? ' bg-secondary' : ' bg-success')
      }
      onClick={() => history.push('/poll/' + pollid)}
      disabled={expired.expired}
    >
      Submit your vote
    </button>
  );

  const ShowUserSelection = () => (
    <span
      className="bg-info w-100 text-decoration-none font-weight-bold mb-5 px-0 py-2 rounded-lg text-center text-white "
      style={{
        wordWrap: 'break-word',
      }}
    >
      You voted for {options.length > 0 ? options[index].options : null}
    </span>
  );
  const ShowGuestSelection = () => (
    <span
      className="bg-info w-100 text-decoration-none font-weight-bold mb-5 px-0 py-2 rounded-lg text-center text-white "
      style={{
        wordWrap: 'break-word',
      }}
    >
      You voted for{' '}
      {options.length > 0
        ? cache
          ? options[cache.index].options
          : null
        : null}
    </span>
  );

  return (
    <div>
      {loader ? <Loader /> : null}
      {report ? (
        <Report
          setReport={setReport}
          pollid={pollid}
          owner={owner}
          setToast={setToast}
        />
      ) : null}
      <Header />
      {username ? (
        <UserIcon username={username} logout={props.logoutAction} />
      ) : null}
      {options.length > 0 ? null : <PollDeleted />}
      <div className="ui-outer position-relative">
        <div
          className="ui-container py-5 position-relative"
          hidden={!(options.length > 0)}
        >
          <div className="mb-5 mb-md-5 pb-md-0 my-4 ">
            <h2
              className=" mb-5 heading resp-width-75"
              style={{
                wordWrap: 'break-word',
              }}
            >
              {question}
            </h2>
            <div className="d-flex flex-column flex-md-row">
              <div className="d-flex px-0 w-100 col-12 col-md-8 flex-column">
                <div className="d-block text-center p-3">
                  <div className=" m-auto switch-box">
                    <FontAwesomeIcon
                      icon={faPollH}
                      size="2x"
                      className="mr-2"
                      style={{ color: toggle ? 'purple' : 'white' }}
                    />
                    <Switch
                      size="default"
                      onClick={() => setToggle(!toggle)}
                      checked={toggle}
                      style={{
                        backgroundColor: 'purple',
                      }}
                    />
                    <FontAwesomeIcon
                      icon={faChartPie}
                      size="2x"
                      className="ml-2"
                      style={{ color: toggle ? 'white' : 'purple' }}
                    />
                  </div>
                </div>
                <div className=" position-relative">
                  <div hidden={toggle}>
                    {options.map((x) => (
                      <div
                        className="bg-white p-4 mb-4 rounded-lg position-relative scale1"
                        key={x.id}
                        style={{
                          border:
                            x.count > 0 && x.count === mostvoted
                              ? `3px solid ${x.color}`
                              : null,
                          boxShadow:
                            x.count > 0 && x.count === mostvoted
                              ? `0 7px 14px 0 ${x.color}66`
                              : '0 5px 14px 0 rgba(0,0,0,0.5)',
                        }}
                      >
                        <div className="d-flex w-100 justify-content-between">
                          <div className="d-flex align-items-center">
                            <h2
                              className="options-text font-weight-bold text-primary-dark mb-0"
                              style={{
                                wordWrap: 'break-word',
                              }}
                            >
                              {x.options}
                            </h2>
                          </div>
                          <div className="d-lg-block d-none">
                            <span
                              className="px-2 text-primary-dark h4 shadow"
                              style={{
                                borderRadius: '20px',
                              }}
                            >
                              {totalvotes === 0
                                ? 0
                                : ((x.count / totalvotes) * 100).toFixed(0)}
                              %
                            </span>
                          </div>
                          <div className="d-lg-none">
                            <span
                              className="px-3 py-1 text-primary-dark h4 shadow position-absolute"
                              style={{
                                top: x.count === mostvoted ? '-15px' : '-10px',
                                right: '-10px',
                                background: 'white',
                                border:
                                  x.count > 0 && x.count === mostvoted
                                    ? `3px solid ${x.color}`
                                    : null,
                                borderRadius: '20px',
                              }}
                            >
                              {totalvotes === 0
                                ? 0
                                : ((x.count / totalvotes) * 100).toFixed(0)}
                              %
                            </span>
                          </div>
                        </div>
                        <div className="w-100 rounded-lg ">
                          <div
                            className="rounded-lg d-block mt-3"
                            style={{
                              width: `${
                                totalvotes === 0
                                  ? 0
                                  : (x.count / totalvotes) * 100
                              }%`,
                              height: '0.5rem',
                              backgroundColor: x.color,
                            }}
                          >
                            &nbsp;
                          </div>
                        </div>
                        <p className="mt-3 mb-0 font-weight-bold h6 text-secondary">
                          {x.count} Votes
                        </p>
                      </div>
                    ))}
                  </div>
                  <div hidden={!toggle} className="chart-bg p-3">
                    <Chart
                      options={chart.options}
                      series={chart.series}
                      labels={chart.labels}
                      type="pie"
                      width="100%"
                    />
                  </div>
                </div>
              </div>
              <div className="d-flex flex-column w-100 col-12 col-md-4 ml-md-3 mb-0 rounded-lg ">
                <span
                  className="text-center mx-auto px-2 py-1 font-weight-bold mb-2"
                  style={{
                    color: expired.expired ? '#ff4444' : '#33b5e5',
                    borderRadius: '20px',
                    background: expired.expired
                      ? 'rgba(255, 68, 68, 0.2)'
                      : 'rgba(51, 181, 229, 0.2)',
                  }}
                >
                  <ErrorOutline fontSize="small" className="mr-2" />
                  {expired.expired
                    ? 'Sorry, the poll has expired!!'
                    : `Expires at ${expired.expiration}`}
                </span>
                <Notification
                  switcher={toast.snackbaropen}
                  close={snackbarclose}
                  message={toast.msg}
                  nottype={toast.not}
                />
                {username ? (
                  voted ? (
                    <ShowUserSelection />
                  ) : (
                    <ShowButton />
                  )
                ) : cache ? (
                  <ShowGuestSelection />
                ) : (
                  <ShowButton />
                )}
                <div className="w-100 bg-white d-flex flex-column border-gray-300 border-top-0 rounded-lg self-start px-3 py-3 ">
                  <div className="d-flex flex-column justify-content-between">
                    <div className="">
                      <p className="font-weight-bold h5 text-secondary mb-0">
                        Total Votes
                      </p>
                      <h1 className="font-weight-bold text-primary-dark">
                        {totalvotes}
                      </h1>
                    </div>

                    <div className="d-flex flex-row flex-md-column">
                      <p className="font-weight-bold d-none d-md-inline-block mt-2 mb-4 text-primary-secondary text-left">
                        Share
                      </p>
                      <button
                        className="bg-warning font-weight-bold mb-3 px-0 py-2 rounded-lg text-center border-0 text-white mr-2 "
                        onClick={() => {
                          setShowQR(true);
                        }}
                      >
                        <FontAwesomeIcon className="mx-3" icon={faQrcode} />
                        <span className="d-none d-md-inline-block ">
                          Share via QRcode
                        </span>
                      </button>
                      <SocialShare
                        url={
                          'http://localhost:5000/poll/' +
                          pollid
                        }
                        question={question}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    className="w-50 mt-3 font-weight-bold px-2 py-1 rounded-lg border bg-secondary text-light"
                    onClick={() => setReport(true)}
                  >
                    Report Poll
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showQR ? <QR /> : null}
      </div>
      <Link to={{ pathname: '/team' }}>
        <p
          className="text-center font-weight-bold"
          style={{ fontSize: '1.3rem', color: 'purple' }}
        >
          Built with <FontAwesomeIcon icon={faHeart} /> by...
        </p>
      </Link>
    </div>
  );
}
const mapStatetoProps = (state) => {
  return {
    userDetails: state.login.userDetails,
  };
};
const mapDispatchToProps = {
  logoutAction: LogoutAction,
};
export default connect(mapStatetoProps, mapDispatchToProps)(PollResult);
